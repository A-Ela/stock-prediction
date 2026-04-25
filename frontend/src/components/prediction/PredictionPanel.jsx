import { useState } from "react";
import API from "../../api/api";

export default function PredictionPanel({ stock }) {
  const [result, setResult] = useState(null);

  const run = async () => {
    const res = await API.post("/predict", {
      symbol: stock.symbol,
      timeframe: 7
    });

    setResult(res.data);
  };

  return (
    <div style={{
      background: "#101828",
      padding: 16,
      borderRadius: 12
    }}>
      <h3>AI Prediction</h3>

      <button onClick={run}>Run Prediction</button>

      {result && (
        <div style={{ marginTop: 10 }}>
          <p>Price: ${result.predictedPrice}</p>
          <p>Confidence: {result.confidence}</p>
        </div>
      )}
    </div>
  );
}