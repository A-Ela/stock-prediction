require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const runMonitor = require("./src/services/monitorService");
const {
  getEmailStatus,
  verifyEmailConnection
} = require("./src/services/emailService");

const start = async () => {
  await connectDB();
  runMonitor();

  const emailStatus = getEmailStatus();
  if (emailStatus.configured) {
    const verify = await verifyEmailConnection();
    if (verify.ok) {
      const status = getEmailStatus();
      console.log(
        `SMTP ready [${status.mode}] ${status.host}:${status.port}`
      );
      if (status.webUI) {
        console.log(`View emails: ${status.webUI}`);
      }
      if (status.mode === "ethereal") {
        console.log(
          "Ethereal previews are logged when emails are sent (previewUrl in API responses)."
        );
      }
    } else {
      console.warn("SMTP verify failed:", verify.error);
    }
  } else {
    console.warn(
      "SMTP not configured. Run: npm run smtp:up — then set SMTP_HOST/SMTP_PORT in backend/.env"
    );
  }

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start().catch((err) => {
  console.error("Server failed to start:", err.message);
  process.exit(1);
});