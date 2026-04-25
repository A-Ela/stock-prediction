const axios = require("axios");

exports.predict = async (req, res) => {
  const { symbol, timeframe } = req.body;

  try {
    const response = await axios.post(
      "http://localhost:8000/predict",
      { symbol, timeframe }
    );

    const result = response.data;

     const saved = await Prediction.create({
        userID: req.user.id,
        stockSymbol: symbol,
        predictedPrice: result.predictedPrice,
        confidence: result.confidence,
        timeframe
    });

    res.json(saved);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "FinGPT service error" });
  }
};