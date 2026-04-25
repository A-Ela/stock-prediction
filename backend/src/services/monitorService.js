const cron = require("node-cron");
const TrackedStock = require("../models/TrackedStock");
const Notification = require("../models/notification");
const { fetchStockData } = require("./stockService");
const { sendStockChangeEmail } = require("./emailService");

const runMonitor = () => {
  cron.schedule("*/2 * * * *", async () => {
    console.log("Running stock monitor...");

    const tracked = await TrackedStock.find().populate("userID");

    for (const t of tracked) {
      try {
        const data = await fetchStockData(t.symbol);
        const price = data.price;
        const previous = t.lastKnownPrice;

        if (typeof previous === "number" && previous !== price) {
          const direction = price > previous ? "up" : "down";
          const message = `Price moved ${direction} from ${previous.toFixed(2)} to ${price.toFixed(2)}`;

          await Notification.create({
            userID: t.userID._id,
            stockSymbol: t.symbol,
            message
          });

          await sendStockChangeEmail({
            to: t.userID.email,
            symbol: t.symbol,
            previousPrice: previous,
            currentPrice: price
          });
        }

        if (t.thresholdHigh && price >= t.thresholdHigh) {
          await Notification.create({
            userID: t.userID._id,
            stockSymbol: t.symbol,
            message: `Price exceeded ${t.thresholdHigh} (Now: ${price.toFixed(2)})`
          });
        }

        if (t.thresholdLow && price <= t.thresholdLow) {
          await Notification.create({
            userID: t.userID._id,
            stockSymbol: t.symbol,
            message: `Price dropped below ${t.thresholdLow} (Now: ${price.toFixed(2)})`
          });
        }

        await TrackedStock.findByIdAndUpdate(t._id, { lastKnownPrice: price });
      } catch (err) {
        console.error(`Monitor failed for ${t.symbol}:`, err.message);
      }
    }
  });
};

module.exports = runMonitor;