import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error

from core.features.engineering import build_training_matrix
from core.ml.model_loader import save_model


def train_xgboost(
    feature_frame: pd.DataFrame,
    symbol: str,
    timeframe: int,
) -> tuple[xgb.XGBRegressor, dict]:
    x_train, y_train = build_training_matrix(feature_frame, timeframe)

    if len(x_train) < 40:
        raise ValueError(
            f"Not enough training rows for {symbol} ({len(x_train)}). "
            "Try a shorter timeframe or longer history period."
        )

    model = xgb.XGBRegressor(
        objective="reg:squarederror",
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
        tree_method="hist",
    )
    model.fit(x_train, y_train, verbose=False)

    predictions = model.predict(x_train)
    rmse = float(np.sqrt(mean_squared_error(y_train, predictions)))
    mae = float(mean_absolute_error(y_train, predictions))
    mean_price = float(y_train.mean())

    metadata = {
        "rmse": rmse,
        "mae": mae,
        "trainRows": int(len(x_train)),
        "meanTargetPrice": mean_price,
    }
    save_model(model, symbol, timeframe, metadata)
    return model, metadata
