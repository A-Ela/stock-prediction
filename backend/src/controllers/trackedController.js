const TrackedStock = require("../models/TrackedStock");

exports.addTracked = async (req, res) => {
  const { symbol, thresholdHigh, thresholdLow } = req.body;

  const exists = await TrackedStock.findOne({
    userID: req.user.id,
    symbol
  });

  if (exists) return res.status(400).json({ msg: "Already tracking" });

  const tracked = await TrackedStock.create({
    userID: req.user.id,
    symbol,
    thresholdHigh,
    thresholdLow
  });

  res.json(tracked);
};

exports.getTracked = async (req, res) => {
  const stocks = await TrackedStock.find({ userID: req.user.id });
  res.json(stocks);
};

exports.removeTracked = async (req, res) => {
  await TrackedStock.deleteOne({
    userID: req.user.id,
    symbol: req.params.symbol
  });

  res.json({ msg: "Removed" });
};