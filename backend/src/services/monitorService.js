const cron = require("node-cron");
const TrackedStock = require("../models/TrackedStock");
const Notification = require("../models/Notification");
const { fetchStockData } = require("./stockService");

const runMonitor = () => {
  cron.schedule("*/2 * * * *", async () => {
    console.log("Running stock monitor...");

    const tracked = await TrackedStock.find();

    for (const t of tracked) {
      const data = await fetchStockData(t.symbol);
      const price = data.price;

      if (t.thresholdHigh && price >= t.thresholdHigh) {
        await Notification.create({
          userID: t.userID,
          stockSymbol: t.symbol,
          message: `Price exceeded ${t.thresholdHigh} (Now: ${price})`
        });
      }

      if (t.thresholdLow && price <= t.thresholdLow) {
        await Notification.create({
          userID: t.userID,
          stockSymbol: t.symbol,
          message: `Price dropped below ${t.thresholdLow} (Now: ${price})`
        });
      }
    }
  });
};

module.exports = runMonitor;