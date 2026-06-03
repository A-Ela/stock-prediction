const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const axios = require("axios");

let transporter;
let devAccountFile = null;
let lastVerify = { ok: false, at: null, error: null };

const getDevAccountPath = () =>
  path.join(__dirname, "..", "..", ".smtp-dev.json");

const buildTransportOptions = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);

  if (!host || !Number.isFinite(port)) {
    return null;
  }

  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const options = {
    host,
    port,
    secure,
    tls:
      process.env.SMTP_IGNORE_TLS === "true"
        ? { rejectUnauthorized: false }
        : undefined
  };

  if (user && pass) {
    options.auth = { user, pass };
  }

  return options;
};

const createTransporterFromOptions = (options) =>
  nodemailer.createTransport(options);

const getGmailAccessToken = async ({ clientId, clientSecret, refreshToken }) => {
  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");

    const res = await axios.post("https://oauth2.googleapis.com/token", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    return res.data.access_token;
  } catch (err) {
    console.warn("Failed to obtain Gmail access token:", err?.response?.data || err.message);
    return null;
  }
};

const loadDevAccount = () => {
  const filePath = getDevAccountPath();
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
};

const saveDevAccount = (account) => {
  const filePath = getDevAccountPath();
  fs.writeFileSync(filePath, JSON.stringify(account, null, 2), "utf8");
  devAccountFile = filePath;
};

const bootstrapEtherealTransport = async () => {
  if (process.env.SMTP_DISABLE_AUTO_DEV === "true") {
    return null;
  }

  let account = loadDevAccount();

  if (!account?.user || !account?.pass) {
    account = await nodemailer.createTestAccount();
    saveDevAccount(account);
  }

  devAccountFile = getDevAccountPath();

  transporter = createTransporterFromOptions({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });

  process.env.SMTP_HOST = account.smtp.host;
  process.env.SMTP_PORT = String(account.smtp.port);
  process.env.SMTP_USER = account.user;
  process.env.SMTP_PASS = account.pass;
  process.env.SMTP_FROM =
    process.env.SMTP_FROM || `StockSight <${account.user}>`;
  process.env.SMTP_WEB_URL = "https://ethereal.email";

  return transporter;
};

const getTransporter = () => {
  if (transporter) return transporter;

  const options = buildTransportOptions();
  if (!options) return null;

  transporter = createTransporterFromOptions(options);
  return transporter;
};

exports.isEmailConfigured = () =>
  Boolean(buildTransportOptions()) || process.env.SMTP_DISABLE_AUTO_DEV !== "true";

exports.getEmailStatus = () => ({
  configured: Boolean(getTransporter() || buildTransportOptions()),
  host: process.env.SMTP_HOST || null,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
  from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  webUI:
    process.env.SMTP_WEB_URL ||
    (Number(process.env.SMTP_PORT) === 1025
      ? "http://localhost:8025"
      : process.env.SMTP_HOST?.includes("ethereal")
        ? "https://ethereal.email"
        : null),
  devAccountFile,
  mode: process.env.SMTP_HOST?.includes("ethereal")
    ? "ethereal"
    : Number(process.env.SMTP_PORT) === 1025
      ? "mailpit"
      : "custom",
  verified: lastVerify.ok,
  lastVerifiedAt: lastVerify.at,
  lastError: lastVerify.error
});

exports.verifyEmailConnection = async () => {
  let activeTransporter = getTransporter();

  // If a transporter is not already available, try to build one from env.
  if (!activeTransporter) {
    const options = buildTransportOptions();

    if (options) {
      // Prefer Gmail OAuth2 if OAuth env vars are present
      const gmailClientId = process.env.GMAIL_CLIENT_ID;
      const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
      const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
      const smtpUser = process.env.SMTP_USER;

      if (gmailClientId && gmailClientSecret && gmailRefreshToken && smtpUser) {
        const token = await getGmailAccessToken({
          clientId: gmailClientId,
          clientSecret: gmailClientSecret,
          refreshToken: gmailRefreshToken
        });

        if (token) {
          options.service = options.service || "gmail";
          options.auth = {
            type: "OAuth2",
            user: smtpUser,
            clientId: gmailClientId,
            clientSecret: gmailClientSecret,
            refreshToken: gmailRefreshToken,
            accessToken: token
          };
        } else if (!options.auth && process.env.SMTP_PASS) {
          // fallback to password if provided
          options.auth = { user: smtpUser, pass: process.env.SMTP_PASS };
        }
      }

      try {
        transporter = createTransporterFromOptions(options);
        activeTransporter = transporter;
      } catch (err) {
        console.warn("Failed to create transporter from env options:", err.message);
        transporter = null;
      }
    }
  }

  // If still no transporter, try Ethereal/dev inbox (unless disabled)
  if (!activeTransporter) {
    activeTransporter = await bootstrapEtherealTransport();
  }

  if (!activeTransporter) {
    lastVerify = {
      ok: false,
      at: new Date().toISOString(),
      error: "SMTP is not configured"
    };
    return lastVerify;
  }

  try {
    await activeTransporter.verify();
    lastVerify = { ok: true, at: new Date().toISOString(), error: null };
  } catch (err) {
    if (process.env.SMTP_DISABLE_AUTO_DEV === "true") {
      lastVerify = {
        ok: false,
        at: new Date().toISOString(),
        error: err.message
      };
      return lastVerify;
    }

    transporter = null;
    const fallback = await bootstrapEtherealTransport();
    if (!fallback) {
      lastVerify = {
        ok: false,
        at: new Date().toISOString(),
        error: err.message
      };
      return lastVerify;
    }

    try {
      await fallback.verify();
      lastVerify = { ok: true, at: new Date().toISOString(), error: null };
      console.warn(
        "Primary SMTP unavailable; using Ethereal dev inbox:",
        process.env.SMTP_WEB_URL
      );
    } catch (fallbackErr) {
      lastVerify = {
        ok: false,
        at: new Date().toISOString(),
        error: fallbackErr.message
      };
    }
  }

  return lastVerify;
};

const getFromAddress = () =>
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  "StockSight <alerts@stocksight.local>";

const buildHtmlWrapper = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #0e7490;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top: 24px; color: #666; font-size: 12px;">— StockSight</p>
    </div>
  </body>
</html>`;

const sendMail = async ({ to, subject, text, html }) => {
  if (!getTransporter()) {
    await exports.verifyEmailConnection();
  }

  const activeTransporter = getTransporter();
  if (!activeTransporter || !to) {
    return { sent: false, reason: "Email not configured or missing recipient" };
  }

  const info = await activeTransporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br>")
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    sent: true,
    messageId: info.messageId,
    previewUrl: previewUrl || null
  };
};

exports.sendDailyDigestEmail = async ({ to, userName, stocks }) => {
  const rows = stocks
    .map((stock) => {
      const price =
        typeof stock.price === "number" ? `$${stock.price.toFixed(2)}` : "N/A";
      const change =
        typeof stock.change === "number"
          ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}`
          : "N/A";
      const pct =
        typeof stock.pct === "number"
          ? `${stock.pct >= 0 ? "+" : ""}${stock.pct.toFixed(2)}%`
          : "N/A";

      return `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${stock.symbol}</strong><br><span style="color:#666;font-size:12px;">${stock.name || stock.symbol}</span></td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${change} (${pct})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">$${typeof stock.thresholdHigh === "number" ? stock.thresholdHigh.toFixed(2) : "—"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">$${typeof stock.thresholdLow === "number" ? stock.thresholdLow.toFixed(2) : "—"}</td>
      </tr>`;
    })
    .join("");

  const subject = `[StockSight] Daily tracked stocks summary`;
  const text = `Hi ${userName || "there"},

Here is your daily summary for ${stocks.length} tracked stock(s):

${stocks
  .map(
    (s) =>
      `${s.symbol}: ${typeof s.price === "number" ? s.price.toFixed(2) : "N/A"}`
  )
  .join("\n")}

— StockSight`;

  const html = buildHtmlWrapper(
    "Daily tracked stocks summary",
    `<p>Hi ${userName || "there"},</p>
     <p>Here is your daily summary for <strong>${stocks.length}</strong> tracked stock(s):</p>
     <table style="width:100%; border-collapse: collapse; font-size: 14px;">
       <thead>
         <tr style="background:#f8fafc;">
           <th align="left" style="padding:8px;">Stock</th>
           <th align="left" style="padding:8px;">Price</th>
           <th align="left" style="padding:8px;">Change</th>
           <th align="left" style="padding:8px;">Alert above</th>
           <th align="left" style="padding:8px;">Alert below</th>
         </tr>
       </thead>
       <tbody>${rows}</tbody>
     </table>`
  );

  return sendMail({ to, subject, text, html });
};

exports.sendThresholdAlertEmail = async ({
  to,
  symbol,
  direction,
  threshold,
  currentPrice
}) => {
  const isHigh = direction === "high";
  const subject = `[StockSight] ${symbol} ${isHigh ? "rose above" : "fell below"} your alert`;
  const text = `${symbol} has ${isHigh ? "exceeded your upper" : "dropped below your lower"} price alert.

Threshold: $${threshold.toFixed(2)}
Current price: $${currentPrice.toFixed(2)}

— StockSight`;

  const color = isHigh ? "#15803d" : "#b91c1c";
  const html = buildHtmlWrapper(
    `${symbol} price alert`,
    `<p><strong>${symbol}</strong> has ${isHigh ? "risen above your upper" : "fallen below your lower"} alert.</p>
     <p style="font-size: 18px; color: ${color}; font-weight: bold;">$${currentPrice.toFixed(2)}</p>
     <p>Threshold: <strong>$${threshold.toFixed(2)}</strong></p>`
  );

  return sendMail({ to, subject, text, html });
};

exports.sendStockChangeEmail = async ({
  to,
  symbol,
  previousPrice,
  currentPrice
}) => {
  const direction = currentPrice >= previousPrice ? "increased" : "decreased";
  const delta = currentPrice - previousPrice;

  return sendMail({
    to,
    subject: `[StockSight] ${symbol} price ${direction}`,
    text: `${symbol} has ${direction} from ${previousPrice.toFixed(2)} to ${currentPrice.toFixed(2)} (${delta >= 0 ? "+" : ""}${delta.toFixed(2)}).`
  });
};
