const {
  isEmailConfigured,
  getEmailStatus,
  verifyEmailConnection,
  sendDailyDigestEmail,
  sendThresholdAlertEmail
} = require("../services/emailService");
const runMonitor = require("../services/monitorService");
const runDailyDigest = runMonitor.runDailyDigest;
const runThresholdCheck = runMonitor.runThresholdCheck;

exports.getEmailStatus = async (_req, res) => {
  const verify = isEmailConfigured() ? await verifyEmailConnection() : null;

  res.json({
    ...getEmailStatus(),
    thresholdCron: process.env.THRESHOLD_MONITOR_CRON || "*/5 * * * *",
    dailyDigestCron: process.env.DAILY_DIGEST_CRON || "0 8 * * *",
    digestTimezone: process.env.DIGEST_TIMEZONE || "America/New_York",
    verify
  });
};

exports.triggerDailyDigest = async (_req, res) => {
  try {
    const result = await runDailyDigest({ force: true });
    res.json({
      msg: "Daily digest job completed",
      email: getEmailStatus(),
      ...result
    });
  } catch (err) {
    console.error("Manual daily digest failed:", err.message);
    res.status(500).json({ msg: "Daily digest job failed", detail: err.message });
  }
};

exports.triggerThresholdCheck = async (_req, res) => {
  try {
    const result = await runThresholdCheck();
    res.json({
      msg: "Threshold monitor completed",
      email: getEmailStatus(),
      ...result
    });
  } catch (err) {
    console.error("Manual threshold check failed:", err.message);
    res.status(500).json({ msg: "Threshold monitor failed", detail: err.message });
  }
};

exports.sendTestEmail = async (req, res) => {
  if (!isEmailConfigured()) {
    return res.status(503).json({
      msg: "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in backend/.env"
    });
  }

  const to = req.user.email;

  try {
    await sendDailyDigestEmail({
      to,
      userName: req.user.name,
      stocks: [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          price: 190.12,
          change: 1.2,
          pct: 0.64,
          thresholdHigh: 200,
          thresholdLow: 175
        }
      ]
    });

    await sendThresholdAlertEmail({
      to,
      symbol: "AAPL",
      direction: "high",
      threshold: 200,
      currentPrice: 201.5
    });

    res.json({
      msg: `Test emails sent to ${to}`,
      webUI: getEmailStatus().webUI
    });
  } catch (err) {
    console.error("Test email failed:", err.message);
    res.status(500).json({ msg: "Failed to send test email", detail: err.message });
  }
};
