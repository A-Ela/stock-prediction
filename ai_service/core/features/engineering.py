import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "sma_5",
    "sma_10",
    "sma_20",
    "rsi",
    "macd",
    "macd_signal",
    "volatility",
    "daily_return",
    "volume_ratio",
    "sentiment_score",
]


def _compute_rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def build_feature_frame(history: pd.DataFrame, sentiment_score: float) -> pd.DataFrame:
    """Engineer technical indicators and attach the FinGPT sentiment feature."""
    frame = history.copy()
    close = frame["close"]
    volume = frame["volume"].replace(0, np.nan)

    frame["sma_5"] = close.rolling(5).mean()
    frame["sma_10"] = close.rolling(10).mean()
    frame["sma_20"] = close.rolling(20).mean()
    frame["rsi"] = _compute_rsi(close)

    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    frame["macd"] = ema_12 - ema_26
    frame["macd_signal"] = frame["macd"].ewm(span=9, adjust=False).mean()

    frame["volatility"] = close.pct_change().rolling(10).std()
    frame["daily_return"] = close.pct_change()
    frame["volume_ratio"] = volume / volume.rolling(10).mean()
    frame["sentiment_score"] = float(sentiment_score)

    frame = frame.replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
    return frame


def latest_feature_row(feature_frame: pd.DataFrame) -> pd.DataFrame:
    if feature_frame.empty:
        raise ValueError("Feature frame is empty after indicator calculation")
    return feature_frame.iloc[[-1]][FEATURE_COLUMNS]


def build_training_matrix(
    feature_frame: pd.DataFrame, timeframe: int
) -> tuple[pd.DataFrame, pd.Series]:
    """Create supervised samples where the target is future close price."""
    horizon = max(1, int(timeframe))
    targets = feature_frame["close"].shift(-horizon)
    features = feature_frame[FEATURE_COLUMNS]
    valid = targets.notna()

    x_train = features.loc[valid].reset_index(drop=True)
    y_train = targets.loc[valid].reset_index(drop=True)
    return x_train, y_train
