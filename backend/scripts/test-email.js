/**
 * Run email/monitor jobs once for local verification.
 * Usage (from backend/): node scripts/test-email.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const {
  isEmailConfigured,
  sendDailyDigestEmail
} = require("../src/services/emailService");
const runMonitor = require("../src/services/monitorService");
const runDailyDigest = runMonitor.runDailyDigest;
const runThresholdCheck = runMonitor.runThresholdCheck;

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
  const { verifyEmailConnection, getEmailStatus } = require("../src/services/emailService");
  const verify = await verifyEmailConnection();
  console.log("SMTP status:", getEmailStatus());
  console.log("SMTP verify:", verify);

  const digest = await runDailyDigest({ force: true });
  console.log("Daily digest result:", digest);

  const threshold = await runThresholdCheck();
  console.log("Threshold check result:", threshold);

  const testTo = process.env.TEST_EMAIL_TO || "trader@stocksight.test";
  const sample = await sendDailyDigestEmail({
    to: testTo,
    userName: "Test User",
    stocks: [
      {
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        price: 215.25,
        change: -5.4,
        pct: -2.4,
        thresholdHigh: 230,
        thresholdLow: 200
      }
    ]
  });
  console.log("Sample digest:", sample);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Email test failed:", err.message);
  process.exit(1);
});
