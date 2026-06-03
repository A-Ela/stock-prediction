const cron = require("node-cron");
const TrackedStock = require("../models/TrackedStock");
const Notification = require("../models/notification");
const User = require("../models/User");
const { fetchStockData } = require("./stockService");
const {
  isEmailConfigured,
  getEmailStatus,
  sendDailyDigestEmail,
  sendThresholdAlertEmail
} = require("./emailService");

const THRESHOLD_CRON = process.env.THRESHOLD_MONITOR_CRON || "*/5 * * * *";
const DAILY_DIGEST_CRON = process.env.DAILY_DIGEST_CRON || "0 8 * * *";
const DIGEST_TIMEZONE = process.env.DIGEST_TIMEZONE || "America/New_York";

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const fetchTrackedQuote = async (symbol) => {
  const data = await fetchStockData(symbol, {
    historyOptions: { range: "5d", interval: "1d" }
  });
  return {
    symbol: data.symbol,
    name: data.name,
    price: data.price,
    change: data.change,
    pct: data.pct,
    currency: data.currency
  };
};

const runThresholdCheck = async () => {
  const tracked = await TrackedStock.find().populate("userID", "email name");
  let alertsSent = 0;

  for (const item of tracked) {
    if (!item.userID?.email) continue;

    try {
      const quote = await fetchTrackedQuote(item.symbol);
      const price = quote.price;
      const previous = item.lastKnownPrice;

      if (typeof previous === "number") {
        if (
          typeof item.thresholdHigh === "number" &&
          previous < item.thresholdHigh &&
          price >= item.thresholdHigh
        ) {
          await Notification.create({
            userID: item.userID._id,
            stockSymbol: item.symbol,
            type: "threshold",
            message: `${item.symbol} rose above $${item.thresholdHigh.toFixed(2)} (now $${price.toFixed(2)})`
          });

          if (isEmailConfigured()) {
            const mail = await sendThresholdAlertEmail({
              to: item.userID.email,
              symbol: item.symbol,
              direction: "high",
              threshold: item.thresholdHigh,
              currentPrice: price
            });
            if (!mail.sent) {
              console.warn(`High-threshold email not sent for ${item.symbol}:`, mail.reason);
            }
          }

          alertsSent += 1;
        }

        if (
          typeof item.thresholdLow === "number" &&
          previous > item.thresholdLow &&
          price <= item.thresholdLow
        ) {
          await Notification.create({
            userID: item.userID._id,
            stockSymbol: item.symbol,
            type: "threshold",
            message: `${item.symbol} fell below $${item.thresholdLow.toFixed(2)} (now $${price.toFixed(2)})`
          });

          if (isEmailConfigured()) {
            const mail = await sendThresholdAlertEmail({
              to: item.userID.email,
              symbol: item.symbol,
              direction: "low",
              threshold: item.thresholdLow,
              currentPrice: price
            });
            if (!mail.sent) {
              console.warn(`Low-threshold email not sent for ${item.symbol}:`, mail.reason);
            }
          }

          alertsSent += 1;
        }
      }

      await TrackedStock.findByIdAndUpdate(item._id, { lastKnownPrice: price });
    } catch (err) {
      console.error(`Threshold monitor failed for ${item.symbol}:`, err.message);
    }
  }

  return { checked: tracked.length, alertsSent };
};

const runDailyDigest = async ({ force = false } = {}) => {
  const users = await User.find({}, "email name lastDailyDigestAt");
  const todayStart = startOfToday();
  let digestsSent = 0;

  for (const user of users) {
    if (
      !force &&
      user.lastDailyDigestAt &&
      new Date(user.lastDailyDigestAt) >= todayStart
    ) {
      continue;
    }

    const tracked = await TrackedStock.find({ userID: user._id });
    if (!tracked.length) continue;

    try {
      const stocks = [];

      for (const item of tracked) {
        try {
          const quote = await fetchTrackedQuote(item.symbol);
          stocks.push({
            ...quote,
            thresholdHigh: item.thresholdHigh,
            thresholdLow: item.thresholdLow
          });
          await TrackedStock.findByIdAndUpdate(item._id, {
            lastKnownPrice: quote.price
          });
        } catch (err) {
          stocks.push({
            symbol: item.symbol,
            name: item.symbol,
            price: item.lastKnownPrice,
            change: null,
            pct: null,
            thresholdHigh: item.thresholdHigh,
            thresholdLow: item.thresholdLow
          });
        }
      }

      if (isEmailConfigured()) {
        const mail = await sendDailyDigestEmail({
          to: user.email,
          userName: user.name,
          stocks
        });
        if (!mail.sent) {
          console.warn(`Daily digest email not sent for ${user.email}:`, mail.reason);
        }
      }

      await Notification.create({
        userID: user._id,
        stockSymbol: null,
        type: "daily",
        message: `Daily digest: ${stocks.length} tracked stock(s) summary${isEmailConfigured() ? " emailed" : " (email not configured)"}`
      });

      await User.findByIdAndUpdate(user._id, { lastDailyDigestAt: new Date() });
      digestsSent += 1;
    } catch (err) {
      console.error(`Daily digest failed for ${user.email}:`, err.message);
    }
  }

  return { usersChecked: users.length, digestsSent };
};

const runMonitor = () => {
  if (!cron.validate(THRESHOLD_CRON)) {
    console.error("Invalid THRESHOLD_MONITOR_CRON:", THRESHOLD_CRON);
  } else {
    cron.schedule(THRESHOLD_CRON, async () => {
      console.log("Running threshold monitor...");
      const result = await runThresholdCheck();
      console.log(
        `Threshold monitor done: checked=${result.checked}, alerts=${result.alertsSent}`
      );
    });
  }

  if (!cron.validate(DAILY_DIGEST_CRON)) {
    console.error("Invalid DAILY_DIGEST_CRON:", DAILY_DIGEST_CRON);
  } else {
    cron.schedule(
      DAILY_DIGEST_CRON,
      async () => {
        console.log("Running daily digest...");
        const result = await runDailyDigest();
        console.log(
          `Daily digest done: users=${result.usersChecked}, sent=${result.digestsSent}`
        );
      },
      { timezone: DIGEST_TIMEZONE }
    );
  }

  console.log(
    `Monitor scheduled: thresholds="${THRESHOLD_CRON}", daily="${DAILY_DIGEST_CRON}" (${DIGEST_TIMEZONE})`
  );
  const email = getEmailStatus();
  console.log(
    `Email delivery: ${email.configured ? `enabled (${email.mode})` : "disabled"}`
  );
  if (email.webUI) {
    console.log(`Email inbox: ${email.webUI}`);
  }
};

runMonitor.runThresholdCheck = runThresholdCheck;
runMonitor.runDailyDigest = runDailyDigest;

module.exports = runMonitor;
