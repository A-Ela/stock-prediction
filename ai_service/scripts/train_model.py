"""
Optional CLI to pre-train XGBoost artifacts for a symbol/timeframe.
Usage (from ai_service/):
  python scripts/train_model.py AAPL 7
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.data.market import fetch_price_history, fetch_recent_news
from core.features.engineering import build_feature_frame
from core.fingpt.sentiment import analyze_articles
from core.ml.train import train_xgboost


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/train_model.py <SYMBOL> <TIMEFRAME_DAYS>")
        sys.exit(1)

    symbol = sys.argv[1]
    timeframe = int(sys.argv[2])

    history = fetch_price_history(symbol)
    sentiment = analyze_articles(fetch_recent_news(symbol))
    features = build_feature_frame(history, sentiment["sentimentScore"])
    model, metadata = train_xgboost(features, symbol, timeframe)

    print(f"Trained model for {symbol.upper()} ({timeframe}d)")
    print(f"Rows: {metadata['trainRows']}, RMSE: {metadata['rmse']:.4f}")


if __name__ == "__main__":
    main()
