const mongoose = require("mongoose");

const trackedSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  symbol: String,
  thresholdHigh: Number,
  thresholdLow: Number,
  lastKnownPrice: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TrackedStock", trackedSchema);