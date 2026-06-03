const TrackedStock = require("../models/TrackedStock");
const Stock = require("../models/Stock");
const { fetchStockData } = require("../services/stockService");

const buildFallbackLiveData = (trackedItem, cachedStock) => {
  const fallbackPrice =
    typeof trackedItem.lastKnownPrice === "number"
      ? trackedItem.lastKnownPrice
      : cachedStock?.currentPrice ?? null;

  return {
    symbol: trackedItem.symbol,
    name: cachedStock?.name || trackedItem.symbol,
    shortName: cachedStock?.name || trackedItem.symbol,
    exchange: "N/A",
    currency: "USD",
    marketState: "STALE",
    type: "EQUITY",
    price: fallbackPrice,
    change: 0,
    pct: 0,
    open: null,
    dayHigh: null,
    dayLow: null,
    previousClose: fallbackPrice,
    volume: null,
    averageVolume: null,
    marketCap: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    updatedAt: null,
    history: cachedStock?.priceHistory || []
  };
};

exports.addTracked = async (req, res) => {
  try {
    const { symbol, thresholdHigh, thresholdLow, lastKnownPrice } = req.body;
    const normalizedSymbol = (symbol || "").toUpperCase().trim();
    if (!normalizedSymbol) return res.status(400).json({ msg: "Symbol is required" });

    const exists = await TrackedStock.findOne({
      userID: req.user.id,
      symbol: normalizedSymbol
    });

    if (exists) return res.status(400).json({ msg: "Already tracking" });

    const tracked = await TrackedStock.create({
      userID: req.user.id,
      symbol: normalizedSymbol,
      thresholdHigh,
      thresholdLow,
      lastKnownPrice: typeof lastKnownPrice === "number" ? lastKnownPrice : null
    });

    res.status(201).json(tracked);
  } catch (err) {
    console.error("Tracked add failed:", err.message);
    res.status(400).json({ msg: "Failed to add tracked stock" });
  }
};

exports.getTracked = async (req, res) => {
  try {
    const stocks = await TrackedStock.find({ userID: req.user.id }).sort({ createdAt: -1 });
    const withLiveData = await Promise.all(
      stocks.map(async (item) => {
        try {
          const live = await fetchStockData(item.symbol, {
            historyOptions: { range: "1mo", interval: "1d" }
          });

          await Stock.findOneAndUpdate(
            { symbol: live.symbol },
            {
              symbol: live.symbol,
              name: live.name,
              currentPrice: live.price,
              priceHistory: live.history
            },
            { upsert: true, new: true }
          );

          return {
            ...item.toObject(),
            live,
            liveStatus: "live"
          };
        } catch (err) {
          const cachedStock = await Stock.findOne({
            symbol: item.symbol.toUpperCase()
          }).lean();

          return {
            ...item.toObject(),
            live: buildFallbackLiveData(item, cachedStock),
            liveStatus: cachedStock || typeof item.lastKnownPrice === "number"
              ? "stale"
              : "unavailable"
          };
        }
      })
    );

    res.json(withLiveData);
  } catch (err) {
    res.status(500).json({ msg: "Failed to load tracked stocks" });
  }
};

exports.updateTracked = async (req, res) => {
  try {
    const normalizedSymbol = (req.params.symbol || "").toUpperCase().trim();
    if (!normalizedSymbol) {
      return res.status(400).json({ msg: "Symbol is required" });
    }

    const { thresholdHigh, thresholdLow } = req.body;
    const updates = {};

    if (thresholdHigh !== undefined) {
      const high = Number(thresholdHigh);
      if (!Number.isFinite(high) || high <= 0) {
        return res.status(400).json({ msg: "thresholdHigh must be a positive number" });
      }
      updates.thresholdHigh = high;
    }

    if (thresholdLow !== undefined) {
      const low = Number(thresholdLow);
      if (!Number.isFinite(low) || low <= 0) {
        return res.status(400).json({ msg: "thresholdLow must be a positive number" });
      }
      updates.thresholdLow = low;
    }

    if (
      updates.thresholdHigh !== undefined &&
      updates.thresholdLow !== undefined &&
      updates.thresholdHigh <= updates.thresholdLow
    ) {
      return res.status(400).json({
        msg: "Upper alert must be greater than lower alert"
      });
    }

    const existing = await TrackedStock.findOne({
      userID: req.user.id,
      symbol: normalizedSymbol
    });

    if (!existing) {
      return res.status(404).json({ msg: "Tracked stock not found" });
    }

    if (
      updates.thresholdHigh !== undefined &&
      updates.thresholdLow === undefined &&
      updates.thresholdHigh <= (existing.thresholdLow ?? 0)
    ) {
      return res.status(400).json({
        msg: "Upper alert must be greater than lower alert"
      });
    }

    if (
      updates.thresholdLow !== undefined &&
      updates.thresholdHigh === undefined &&
      updates.thresholdLow >= (existing.thresholdHigh ?? Infinity)
    ) {
      return res.status(400).json({
        msg: "Lower alert must be less than upper alert"
      });
    }

    const tracked = await TrackedStock.findOneAndUpdate(
      { userID: req.user.id, symbol: normalizedSymbol },
      updates,
      { new: true }
    );

    res.json(tracked);
  } catch (err) {
    console.error("Tracked update failed:", err.message);
    res.status(500).json({ msg: "Failed to update tracked stock" });
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
