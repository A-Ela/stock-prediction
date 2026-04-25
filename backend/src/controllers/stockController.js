const { fetchStockData } = require("../services/stockService");

exports.getStock = async (req, res) => {
  const data = await fetchStockData(req.params.symbol);
  await Stock.findOneAndUpdate(
    { symbol: data.symbol },
    data,
    { upsert: true }
  );

  res.json(data);
};