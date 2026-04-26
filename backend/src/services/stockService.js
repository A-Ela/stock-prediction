const axios = require("axios");

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9"
};

const yahooClient = axios.create({
  baseURL: "https://query1.finance.yahoo.com",
  headers: YAHOO_HEADERS,
  timeout: 10000
});

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapHistory = (result) => {
  const timestamps = result?.timestamp || [];
  const prices = result?.indicators?.quote?.[0]?.close || [];

  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000),
      price: toNumber(prices[index])
    }))
    .filter((point) => point.price !== null);
};

const mapQuoteToStock = ({ symbol, quote, history }) => {
  const normalizedSymbol = symbol.toUpperCase();
  const latestHistoryPrice = history.at(-1)?.price ?? null;
  const historyPreviousClose = history.length > 1 ? history.at(-2)?.price ?? null : null;
  const price = toNumber(
    quote?.regularMarketPrice ??
      quote?.postMarketPrice ??
      quote?.preMarketPrice ??
      quote?.ask ??
      latestHistoryPrice
  );
  const previousClose = toNumber(
    quote?.regularMarketPreviousClose ??
      quote?.previousClose ??
      historyPreviousClose ??
      quote?.chartPreviousClose
  );
  const explicitChange = toNumber(quote?.regularMarketChange);
  const change =
    explicitChange ??
    (price !== null && previousClose !== null ? price - previousClose : 0);
  const explicitPct = toNumber(quote?.regularMarketChangePercent);
  const pct =
    explicitPct ??
    (change !== null && previousClose
      ? (change / previousClose) * 100
      : 0);

  return {
    symbol: normalizedSymbol,
    name:
      quote?.longName ||
      quote?.shortName ||
      quote?.displayName ||
      normalizedSymbol,
    shortName: quote?.shortName || quote?.displayName || normalizedSymbol,
    exchange:
      quote?.fullExchangeName ||
      quote?.exchange ||
      quote?.exchangeName ||
      "N/A",
    currency: quote?.currency || "USD",
    marketState: quote?.marketState || "UNKNOWN",
    type: quote?.quoteType || quote?.instrumentType || "EQUITY",
    price,
    change: change ?? 0,
    pct: pct ?? 0,
    open: toNumber(quote?.regularMarketOpen ?? quote?.open),
    dayHigh: toNumber(quote?.regularMarketDayHigh),
    dayLow: toNumber(quote?.regularMarketDayLow),
    previousClose,
    volume: toNumber(quote?.regularMarketVolume),
    averageVolume: toNumber(quote?.averageDailyVolume3Month),
    marketCap: toNumber(quote?.marketCap),
    fiftyTwoWeekHigh: toNumber(quote?.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: toNumber(quote?.fiftyTwoWeekLow),
    updatedAt: quote?.regularMarketTime
      ? new Date(quote.regularMarketTime * 1000).toISOString()
      : null,
    history
  };
};

const fetchChartData = async (symbol, historyOptions = {}) => {
  const interval = historyOptions.interval || "1d";
  const range = historyOptions.range || "3mo";

  const res = await yahooClient.get(`/v8/finance/chart/${symbol}`, {
    params: { interval, range }
  });

  const result = res.data?.chart?.result?.[0];

  if (!result) {
    throw new Error(`History not found for ${symbol}`);
  }

  return {
    meta: result.meta || {},
    history: mapHistory(result)
  };
};

exports.fetchStockData = async (symbol, options = {}) => {
  const normalizedSymbol = (symbol || "").trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error("Symbol is required");
  }

  try {
    const chartData = await fetchChartData(normalizedSymbol, options.historyOptions);
    const mergedQuote = {
      ...chartData.meta,
      ...(options.quote || {})
    };

    const stock = mapQuoteToStock({
      symbol: normalizedSymbol,
      quote: mergedQuote,
      history: chartData.history
    });

    if (stock.price === null) {
      throw new Error(`No live price available for ${normalizedSymbol}`);
    }

    return stock;
  } catch (err) {
    console.error("Yahoo API error:", err.message);
    throw err;
  }
};

exports.searchStocks = async (query) => {
  const q = (query || "").trim();

  if (!q) {
    return [];
  }

  const res = await yahooClient.get("/v1/finance/search", {
    params: {
      q,
      quotesCount: 10,
      newsCount: 0,
      lang: "en-US",
      region: "US"
    }
  });

  return (res.data?.quotes || [])
    .filter(
      (item) =>
        item.symbol &&
        (item.shortname || item.longname || item.symbol) &&
        item.quoteType !== "MUTUALFUND"
    )
    .map((item) => ({
      symbol: item.symbol,
      name: item.longname || item.shortname || item.symbol,
      exchange: item.exchange || item.fullExchangeName || "N/A",
      type: item.quoteType || "EQUITY"
    }));
};

exports.fetchMarketList = async ({ page = 1, pageSize = 12 } = {}) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.max(1, Number(pageSize) || 12);
  const start = (normalizedPage - 1) * normalizedPageSize;

  const res = await yahooClient.get("/v1/finance/screener/predefined/saved", {
    params: {
      scrIds: "most_actives",
      count: normalizedPageSize,
      start,
      formatted: "false",
      lang: "en-US",
      region: "US"
    }
  });

  const market = res.data?.finance?.result?.[0];

  if (!market) {
    throw new Error("Market list is unavailable");
  }

  const quotes = (market.quotes || []).filter((item) => item.symbol);
  const results = await Promise.allSettled(
    quotes.map((quote) =>
      exports.fetchStockData(quote.symbol, {
        quote,
        historyOptions: { range: "1mo", interval: "1d" }
      })
    )
  );

  const items = results
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value);
  const total = Number.isFinite(Number(market.total))
    ? Number(market.total)
    : start + items.length;
  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const safePage = Math.min(normalizedPage, totalPages);

  return {
    page: safePage,
    pageSize: normalizedPageSize,
    total,
    totalPages,
    hasMore: safePage < totalPages,
    items
  };
};
