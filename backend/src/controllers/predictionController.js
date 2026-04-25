const axios = require("axios");
const Prediction = require("../models/Prediction");

exports.predict = async (req, res) => {
  const { symbol, timeframe } = req.body;

  try {
    const response = await axios.post(
      process.env.AI_SERVICE_URL || "http://localhost:8000/predict",
      { symbol, timeframe }
    );

    const result = response.data;

    const saved = await Prediction.create({
      userID: req.user.id,
      symbol: symbol.toUpperCase(),
      predictedPrice: result.predictedPrice,
      confidence: result.confidence,
      timeframe
    });

    res.json({
      predictionId: saved._id,
      symbol: result.symbol || symbol.toUpperCase(),
      predictedPrice: result.predictedPrice,
      confidence: result.confidence,
      currentPrice: result.currentPrice,
      timeframe
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "FinGPT service error" });
  }
};