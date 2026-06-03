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
const {
  runDailyDigest,
  runThresholdCheck
} = require("../src/services/monitorService");

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
  console.log("SMTP configured:", isEmailConfigured());

  const digest = await runDailyDigest({ force: true });
  console.log("Daily digest result:", digest);

  const threshold = await runThresholdCheck();
  console.log("Threshold check result:", threshold);

  if (isEmailConfigured() && process.env.TEST_EMAIL_TO) {
    await sendDailyDigestEmail({
      to: process.env.TEST_EMAIL_TO,
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
    console.log("Direct test email sent to", process.env.TEST_EMAIL_TO);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Email test failed:", err.message);
  process.exit(1);
});
