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

exports.sendStockChangeEmail = async ({ to, symbol, previousPrice, currentPrice }) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter || !to) return;

  const direction = currentPrice >= previousPrice ? "increased" : "decreased";
  const delta = currentPrice - previousPrice;

  await activeTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `[StockSight] ${symbol} price ${direction}`,
    text: `${symbol} has ${direction} from ${previousPrice.toFixed(2)} to ${currentPrice.toFixed(2)} (${delta >= 0 ? "+" : ""}${delta.toFixed(2)}).`
  });
};
