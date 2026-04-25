const axios = require("axios");

exports.fetchStockData = async (symbol) => {
  try {
    const res = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: {
          interval: "1d",
          range: "1mo"
        }
      }
    );

    const result = res.data.chart.result?.[0];

    if (!result) {
      throw new Error("Invalid symbol or no data");
    }

    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    const history = timestamps.map((t, i) => ({
      date: new Date(t * 1000),
      price: prices[i]
    })).filter(d => d.price !== null);

    return {
      symbol,
      price: result.meta.regularMarketPrice,
      history
    };

  } catch (err) {
    console.error("Yahoo API error:", err.message);
    throw err;
  }
};