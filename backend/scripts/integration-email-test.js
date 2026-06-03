/**
 * Integration test: runs threshold monitor and daily digest against an in-memory MongoDB.
 * Usage: node scripts/integration-email-test.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/models/User");
const TrackedStock = require("../src/models/TrackedStock");
const Notification = require("../src/models/notification");
const runMonitor = require("../src/services/monitorService");

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log("Starting in-memory mongo at", uri);

  await mongoose.connect(uri);

  // Create a user
  const user = await User.create({
    name: "Integration Test",
    email: process.env.TEST_EMAIL_TO || "trader@stocksight.test",
    passwordHash: "x"
  });

  // Create a tracked stock that will trigger a high threshold (choose a low threshold so live price crosses it)
  const tracked = await TrackedStock.create({
    userID: user._id,
    symbol: "AAPL",
    thresholdHigh: 1,
    thresholdLow: 0.5,
    lastKnownPrice: 0
  });

  // Ensure email connection is verified (will fallback to Ethereal if primary SMTP is unavailable)
  const emailService = require("../src/services/emailService");
  const verify = await emailService.verifyEmailConnection();
  console.log("Email verify:", verify);

  console.log("Running threshold check (should send alert if mocked price >= 100)...");
  const threshResult = await runMonitor.runThresholdCheck();
  console.log("Threshold result:", threshResult);

  console.log("Running daily digest...");
  const digestResult = await runMonitor.runDailyDigest({ force: true });
  console.log("Digest result:", digestResult);

  const notifications = await Notification.find().lean();
  console.log("Notifications created:", notifications.length);
  notifications.forEach((n) => console.log(n.type, n.message, n.userID.toString()));

  await mongoose.disconnect();
  await mongod.stop();

  console.log("Integration test finished.");
}

main().catch((err) => {
  console.error("Integration email test failed:", err?.message || err);
  process.exit(1);
});
