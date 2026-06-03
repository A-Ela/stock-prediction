const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
};

exports.isEmailConfigured = () => Boolean(getTransporter());

const sendMail = async ({ to, subject, text, html }) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter || !to) {
    return { sent: false, reason: "Email not configured or missing recipient" };
  }

  await activeTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br>")
  });

  return { sent: true };
};

exports.sendDailyDigestEmail = async ({ to, userName, stocks }) => {
  const lines = stocks.map((stock) => {
    const price =
      typeof stock.price === "number" ? stock.price.toFixed(2) : "N/A";
    const change =
      typeof stock.change === "number"
        ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}`
        : "N/A";
    const pct =
      typeof stock.pct === "number"
        ? `${stock.pct >= 0 ? "+" : ""}${stock.pct.toFixed(2)}%`
        : "N/A";
    const high =
      typeof stock.thresholdHigh === "number"
        ? stock.thresholdHigh.toFixed(2)
        : "—";
    const low =
      typeof stock.thresholdLow === "number"
        ? stock.thresholdLow.toFixed(2)
        : "—";

    return `${stock.symbol} (${stock.name || stock.symbol})
  Price: $${price} | Change: ${change} (${pct})
  Alert above: $${high} | Alert below: $${low}`;
  });

  const subject = `[StockSight] Daily tracked stocks summary`;
  const text = `Hi ${userName || "there"},

Here is your daily summary for ${stocks.length} tracked stock(s):

${lines.join("\n\n")}

— StockSight`;

  return sendMail({ to, subject, text });
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

  return sendMail({ to, subject, text });
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
