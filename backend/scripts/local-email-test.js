/**
 * Lightweight local email test (no MongoDB required).
 * Usage: node scripts/local-email-test.js
 */
require("dotenv").config();
const {
  verifyEmailConnection,
  getEmailStatus,
  sendDailyDigestEmail,
  sendThresholdAlertEmail
} = require("../src/services/emailService");

async function main() {
  console.log("Email status (before verify):", getEmailStatus());

  const verify = await verifyEmailConnection();
  console.log("verify result:", verify);
  console.log("Email status:", getEmailStatus());

  const to = process.env.TEST_EMAIL_TO || "trader@stocksight.test";

  console.log(`Sending sample daily digest to ${to}...`);
  const daily = await sendDailyDigestEmail({
    to,
    userName: "Local Tester",
    stocks: [
      { symbol: "AAPL", name: "Apple Inc.", price: 190.12, change: 1.2, pct: 0.64, thresholdHigh: 200, thresholdLow: 175 }
    ]
  });
  console.log("daily result:", daily);

  console.log(`Sending threshold alert (above) to ${to}...`);
  const alertHigh = await sendThresholdAlertEmail({
    to,
    symbol: "AAPL",
    direction: "high",
    threshold: 180,
    currentPrice: 185.5
  });
  console.log("alertHigh result:", alertHigh);

  console.log(`Sending threshold alert (below) to ${to}...`);
  const alertLow = await sendThresholdAlertEmail({
    to,
    symbol: "NVDA",
    direction: "low",
    threshold: 200,
    currentPrice: 195.75
  });
  console.log("alertLow result:", alertLow);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Local email test failed:", err?.message || err);
  process.exit(1);
});
