/**
 * Simulates a user: browse stocks -> select NVDA -> pick 7D -> run prediction.
 * Run: node scripts/e2e-predict-test.js
 */
const axios = require("axios");

const API = "http://localhost:5000/api";
const AI = "http://localhost:8000";

const client = axios.create({ timeout: 300000 });

async function main() {
  console.log("1) AI health...");
  const health = await client.get(`${AI}/health`);
  console.log("   ", health.data);

  console.log("2) Load market stocks (Predict page)...");
  const stocks = await client.get(`${API}/stocks`, { params: { page: 1, pageSize: 9 } });
  const items = stocks.data.items || [];
  if (!items.length) throw new Error("No stocks returned");
  const pick = items.find((s) => s.symbol === "NVDA") || items[0];
  console.log("   selected:", pick.symbol, "@", pick.price);

  console.log("3) Load stock detail (3mo history)...");
  const detail = await client.get(`${API}/stock/${pick.symbol}`, {
    params: { range: "3mo", interval: "1d" }
  });
  console.log("   history points:", detail.data.history?.length || 0);

  const email = `e2e_${Date.now()}@test.local`;
  const password = "TestPass123!";

  console.log("4) Register test user...");
  const auth = await client.post(`${API}/auth/register`, {
    name: "E2E User",
    email,
    password
  });
  const token = auth.data.token;

  const timeframe = 7;
  console.log(`5) Run prediction (${pick.symbol}, ${timeframe}D)...`);
  const prediction = await client.post(
    `${API}/predict`,
    { symbol: pick.symbol, timeframe },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const p = prediction.data;
  console.log("   prediction response:");
  console.log("    symbol:", p.symbol);
  console.log("    timeframe:", p.timeframe);
  console.log("    currentPrice:", p.currentPrice);
  console.log("    predictedPrice:", p.predictedPrice);
  console.log("    confidence:", p.confidence);
  console.log("    sentimentScore:", p.sentimentScore);
  console.log("    sentimentLabel:", p.sentimentLabel);
  console.log("    predictionId:", p.predictionId);

  if (p.symbol !== pick.symbol) throw new Error("Symbol mismatch in response");
  if (p.timeframe !== timeframe) throw new Error("Timeframe mismatch in response");
  if (!Number.isFinite(p.predictedPrice) || p.predictedPrice <= 0) {
    throw new Error("Invalid predicted price");
  }
  if (!Number.isFinite(p.currentPrice) || p.currentPrice <= 0) {
    throw new Error("Invalid current price");
  }
  if (p.confidence < 0 || p.confidence > 1) throw new Error("Invalid confidence");

  console.log("\nE2E prediction flow OK");
}

main().catch((err) => {
  console.error("\nE2E FAILED:", err.response?.data || err.message);
  process.exit(1);
});
