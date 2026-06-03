/**
 * Adds Mailpit SMTP settings to backend/.env if they are missing.
 * Usage: node scripts/setup-smtp-env.js
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const block = `
# Email (Mailpit local SMTP — npm run smtp:up)
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_FROM=StockSight <alerts@stocksight.local>
SMTP_WEB_URL=http://localhost:8025
`;

const required = ["SMTP_HOST=", "SMTP_PORT="];

let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf8");
  if (required.every((key) => content.includes(key))) {
    console.log("SMTP settings already present in backend/.env");
    process.exit(0);
  }
  fs.appendFileSync(envPath, block, "utf8");
  console.log("Appended Mailpit SMTP settings to backend/.env");
} else {
  fs.writeFileSync(envPath, block.trim() + "\n", "utf8");
  console.log("Created backend/.env with Mailpit SMTP settings");
}

console.log("Start Mailpit (optional): npm run smtp:up");
console.log("Mailpit inbox: http://localhost:8025");
console.log(
  "If Mailpit is not running, the backend auto-falls back to Ethereal test SMTP."
);
