const TrackedStock = require("../models/TrackedStock");
const { fetchStockData } = require("../services/stockService");

exports.addTracked = async (req, res) => {
  try {
    const { symbol, thresholdHigh, thresholdLow } = req.body;
    const normalizedSymbol = (symbol || "").toUpperCase().trim();
    if (!normalizedSymbol) return res.status(400).json({ msg: "Symbol is required" });

    const exists = await TrackedStock.findOne({
      userID: req.user.id,
      symbol: normalizedSymbol
    });

    if (exists) return res.status(400).json({ msg: "Already tracking" });

    const stock = await fetchStockData(normalizedSymbol);
    const tracked = await TrackedStock.create({
      userID: req.user.id,
      symbol: normalizedSymbol,
      thresholdHigh,
      thresholdLow,
      lastKnownPrice: stock.price
    });

    res.status(201).json(tracked);
  } catch (err) {
    res.status(400).json({ msg: "Failed to add tracked stock" });
  }
};

exports.getTracked = async (req, res) => {
  try {
    const stocks = await TrackedStock.find({ userID: req.user.id }).sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ msg: "Failed to load tracked stocks" });
  }
};

exports.removeTracked = async (req, res) => {
  try {
    await TrackedStock.deleteOne({
      userID: req.user.id,
      symbol: req.params.symbol.toUpperCase()
    });

    res.json({ msg: "Removed" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to remove tracked stock" });
  }
};