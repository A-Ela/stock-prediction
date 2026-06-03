import logging

import numpy as np

from core.data.market import fetch_price_history, fetch_recent_news
from core.features.engineering import (
    FEATURE_COLUMNS,
    build_feature_frame,
    latest_feature_row,
)
from core.fingpt.sentiment import analyze_articles
from core.ml.model_loader import load_metadata, load_model, model_is_fresh
from core.ml.train import train_xgboost

logger = logging.getLogger(__name__)


def _confidence_from_metadata(metadata: dict, current_price: float) -> float:
    rmse = float(metadata.get("rmse", 0) or 0)
    if current_price <= 0:
        return 0.5

    relative_error = rmse / current_price
    confidence = 1.0 - min(relative_error, 0.9)
    return float(np.clip(confidence, 0.1, 0.99))


def predict_stock(symbol: str, timeframe: int) -> dict:
    """
    End-to-end prediction pipeline:
    market data -> FinGPT sentiment -> feature engineering -> XGBoost forecast.
    """
    normalized_symbol = symbol.strip().upper()
    horizon = max(1, min(int(timeframe), 30))

    history = fetch_price_history(normalized_symbol)
    news = fetch_recent_news(normalized_symbol)
    sentiment = analyze_articles(news)

    feature_frame = build_feature_frame(
        history, sentiment_score=sentiment["sentimentScore"]
    )
    current_price = float(history["close"].iloc[-1])

    model = load_model(normalized_symbol, horizon)
    metadata = load_metadata(normalized_symbol, horizon)

    if model is None or not model_is_fresh(normalized_symbol, horizon):
        logger.info("Training XGBoost model for %s (%sd)", normalized_symbol, horizon)
        model, metadata = train_xgboost(feature_frame, normalized_symbol, horizon)

    latest_features = latest_feature_row(feature_frame)
    predicted_price = float(model.predict(latest_features[FEATURE_COLUMNS])[0])
    predicted_price = max(predicted_price, 0.01)

    confidence = _confidence_from_metadata(metadata, current_price)

    return {
        "symbol": normalized_symbol,
        "predictedPrice": predicted_price,
        "currentPrice": current_price,
        "confidence": confidence,
        "sentimentScore": sentiment["sentimentScore"],
        "sentimentLabel": sentiment["sentimentLabel"],
        "sentimentEngine": sentiment.get("sentimentEngine"),
        "timeframe": horizon,
        "newsCount": sentiment["articleCount"],
        "featuresUsed": FEATURE_COLUMNS,
        "modelMetrics": {
            "rmse": metadata.get("rmse"),
            "mae": metadata.get("mae"),
            "trainRows": metadata.get("trainRows"),
        },
    }
