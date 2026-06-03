const axios = require("axios");
const Prediction = require("../models/Prediction");

const AI_PREDICT_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/predict";
const AI_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 180000;

const callAiPredict = async (payload, attempt = 1) => {
  try {
    return await axios.post(AI_PREDICT_URL, payload, { timeout: AI_TIMEOUT_MS });
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || "";

    if (status === 503 && attempt < 8 && /loading|not ready/i.test(detail)) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return callAiPredict(payload, attempt + 1);
    }

    throw err;
  }
};

exports.predict = async (req, res) => {
  const { symbol, timeframe } = req.body;

  if (!symbol || timeframe === undefined || timeframe === null) {
    return res.status(400).json({ msg: "Symbol and timeframe are required" });
  }

  const normalizedSymbol = String(symbol).trim().toUpperCase();
  const parsedTimeframe = Number(timeframe);

  if (!normalizedSymbol || !Number.isFinite(parsedTimeframe)) {
    return res.status(400).json({ msg: "Invalid symbol or timeframe" });
  }

  try {
    const response = await callAiPredict({
      symbol: normalizedSymbol,
      timeframe: parsedTimeframe
    });

    const result = response.data;
    const resolvedTimeframe = result.timeframe ?? parsedTimeframe;

    const saved = await Prediction.create({
      userID: req.user.id,
      symbol: result.symbol || normalizedSymbol,
      predictedPrice: result.predictedPrice,
      confidence: result.confidence,
      sentimentScore: result.sentimentScore,
      sentimentLabel: result.sentimentLabel,
      timeframe: resolvedTimeframe
    });

    res.json({
      predictionId: saved._id,
      symbol: result.symbol || normalizedSymbol,
      predictedPrice: result.predictedPrice,
      confidence: result.confidence,
      currentPrice: result.currentPrice,
      sentimentScore: result.sentimentScore,
      sentimentLabel: result.sentimentLabel,
      timeframe: resolvedTimeframe
    });
  } catch (err) {
    const detail =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message;

    console.error("Prediction error:", detail);

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        msg: "AI prediction service is not running",
        detail
      });
    }

    if (err.response?.status === 400) {
      return res.status(400).json({ msg: detail || "Invalid prediction request" });
    }

    res.status(502).json({
      msg: "Prediction service error",
      detail
    });
  }
};