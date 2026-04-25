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
      symbol: symbol.toUpperCase(),
      name: result.meta.longName || result.meta.shortName || symbol.toUpperCase(),
      price: result.meta.regularMarketPrice,
      change: result.meta.regularMarketChange || 0,
      pct: result.meta.regularMarketChangePercent || 0,
      history
    };

  } catch (err) {
    console.error("Yahoo API error:", err.message);
    throw err;
  }
};

exports.searchStocks = async (query) => {
  const q = (query || "").trim();
  if (!q) return [];

  const res = await axios.get("https://query1.finance.yahoo.com/v1/finance/search", {
    params: { q, quotesCount: 10, newsCount: 0 }
  });

  return (res.data?.quotes || [])
    .filter((item) => item.symbol && (item.shortname || item.longname || item.symbol))
    .map((item) => ({
      symbol: item.symbol,
      name: item.longname || item.shortname || item.symbol,
      exchange: item.exchange || item.fullExchangeName || "N/A",
      type: item.quoteType || "EQUITY"
    }));
};