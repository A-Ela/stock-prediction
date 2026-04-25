const router = require("express").Router();
const auth = require("../controllers/authController");
const stock = require("../controllers/stockController");
const prediction = require("../controllers/predictionController");
const tracked = require("../controllers/trackedController")
const notification = require("../controllers/notificationController")
const authMiddleware = require("../middleware/authMiddleware")

router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);

router.get("/stock/:symbol", stock.getStock);
router.post("/predict", prediction.predict);

router.post("/tracked", authMiddleware, tracked.addTracked);
router.get("/tracked", authMiddleware, tracked.getTracked);
router.delete("/tracked/:symbol", authMiddleware, tracked.removeTracked);

router.get("/notifications", authMiddleware, notification.getNotifications);
router.patch("/notifications/:id", authMiddleware, notification.markRead);

module.exports = router;