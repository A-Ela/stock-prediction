/**
 * Tests tracked threshold selection and backend validation by calling controller methods directly.
 * Usage: node scripts/threshold-selection-test.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/models/User");
const TrackedStock = require("../src/models/TrackedStock");
const trackedController = require("../src/controllers/trackedController");

function mockReq(user, body = {}, params = {}) {
  return { user, body, params };
}

function mockRes() {
  let statusCode = 200;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      this.statusCode = statusCode;
      return this;
    }
  };
  return res;
}

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  const user = await User.create({ name: "Tester", email: "tester@example.test", passwordHash: "x" });

  // Add a tracked stock
  const addReq = mockReq({ id: user._id }, { symbol: "TSLA", thresholdHigh: 900, thresholdLow: 100, lastKnownPrice: 500 });
  const addRes = mockRes();
  await trackedController.addTracked(addReq, addRes);
  console.log("Add tracked response status:", addRes.statusCode);
  if (addRes.payload) console.log(addRes.payload);

  // Attempt invalid updates
  // 1) Set upper <= 0
  let updReq = mockReq({ id: user._id }, { thresholdHigh: -5 }, { symbol: "TSLA" });
  let updRes = mockRes();
  await trackedController.updateTracked(updReq, updRes);
  console.log("Update negative high status:", updRes.statusCode, updRes.payload?.msg || "no payload");

  // 2) Set lower >= upper
  updReq = mockReq({ id: user._id }, { thresholdLow: 1000 }, { symbol: "TSLA" });
  updRes = mockRes();
  await trackedController.updateTracked(updReq, updRes);
  console.log("Update low >= high status:", updRes.statusCode, updRes.payload?.msg || "no payload");

  // 3) Valid update: set new thresholds with high > low
  updReq = mockReq({ id: user._id }, { thresholdHigh: 950, thresholdLow: 450 }, { symbol: "TSLA" });
  updRes = mockRes();
  await trackedController.updateTracked(updReq, updRes);
  console.log("Valid update status:", updRes.statusCode);
  if (updRes.payload) console.log(updRes.payload);

  await mongoose.disconnect();
  await mongod.stop();
}

run().catch((err) => { console.error(err); process.exit(1); });
