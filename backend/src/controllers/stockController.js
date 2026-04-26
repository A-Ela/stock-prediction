const { fetchStockData, searchStocks } = require("../services/stockService");
const Stock = require("../models/Stock");
const defaultSymbols = require("../data/defaultSymbols");

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

exports.listStocks = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(30, Math.max(6, Number(req.query.pageSize) || 12));

    const start = (page - 1) * pageSize;
    const symbols = defaultSymbols.slice(start, start + pageSize);

    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        const data = await fetchStockData(symbol);
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
        return data;
      })
    );

    const items = results
      .filter((item) => item.status === "fulfilled")
      .map((item) => item.value);

    const total = defaultSymbols.length;
    const hasMore = start + pageSize < total;

    res.json({ page, pageSize, total, hasMore, items });
  } catch (err) {
    res.status(400).json({ msg: "Unable to load stock list" });
  }
};