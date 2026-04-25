const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  symbol: String,
  predictedPrice: Number,
  confidence: Number,
  timeframe: Number,
  predictedAt: { type: Date, default: Date.now },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Prediction", predictionSchema);