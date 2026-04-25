const { fetchStockData, searchStocks } = require("../services/stockService");
const Stock = require("../models/Stock");

exports.getStock = async (req, res) => {
  try {
    const data = await fetchStockData(req.params.symbol);
    await Stock.findOneAndUpdate(
      { symbol: data.symbol },
      {
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.price,
        priceHistory: data.history
      },
      { upsert: true, new: true }
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ msg: "Unable to fetch stock data" });
  }
};

exports.searchStock = async (req, res) => {
  try {
    const results = await searchStocks(req.query.q);
    res.json(results);
  } catch (err) {
    res.status(400).json({ msg: "Unable to search stocks" });
  }
};