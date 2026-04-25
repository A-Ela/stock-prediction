const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema({
  date: Date,
  price: Number
});

const stockSchema = new mongoose.Schema({
  symbol: { type: String, unique: true },
  name: String,
  currentPrice: Number,
  priceHistory: [priceSchema]
});

module.exports = mongoose.model("Stock", stockSchema);