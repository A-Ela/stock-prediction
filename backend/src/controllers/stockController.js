const {
  fetchMarketList,
  fetchStockData,
  searchStocks
} = require("../services/stockService");
const Stock = require("../models/Stock");

exports.getStock = async (req, res) => {
  try {
    const data = await fetchStockData(req.params.symbol, {
      historyOptions: {
        range: req.query.range || "3mo",
        interval: req.query.interval || "1d"
      }
    });

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

    const data = await fetchMarketList({ page, pageSize });

    await Promise.allSettled(
      data.items.map(async (item) => {
        await Stock.findOneAndUpdate(
          { symbol: item.symbol },
          {
            symbol: item.symbol,
            name: item.name,
            currentPrice: item.price,
            priceHistory: item.history
          },
          { upsert: true, new: true }
        );
      })
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ msg: "Unable to load stock list" });
  }
};
