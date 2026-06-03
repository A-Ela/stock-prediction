const router = require("express").Router();
const auth = require("../controllers/authController");
const stock = require("../controllers/stockController");
const prediction = require("../controllers/predictionController");
const tracked = require("../controllers/trackedController")
const notification = require("../controllers/notificationController")
const emailTest = require("../controllers/emailTestController")
const authMiddleware = require("../middleware/authMiddleware")

router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);

router.get("/stock/search", stock.searchStock);
router.get("/stocks", stock.listStocks);
router.get("/stock/:symbol", stock.getStock);
router.post("/predict", authMiddleware, prediction.predict);

router.post("/tracked", authMiddleware, tracked.addTracked);
router.get("/tracked", authMiddleware, tracked.getTracked);
router.patch("/tracked/:symbol", authMiddleware, tracked.updateTracked);
router.delete("/tracked/:symbol", authMiddleware, tracked.removeTracked);

router.get("/email/status", authMiddleware, emailTest.getEmailStatus);
router.post("/email/test", authMiddleware, emailTest.sendTestEmail);
router.post("/email/run-daily-digest", authMiddleware, emailTest.triggerDailyDigest);
router.post("/email/run-threshold-check", authMiddleware, emailTest.triggerThresholdCheck);

router.get("/notifications", authMiddleware, notification.getNotifications);
router.patch("/notifications/:id", authMiddleware, notification.markRead);

module.exports = router;