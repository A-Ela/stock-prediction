import json
import os
from pathlib import Path

import xgboost as xgb

ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "artifacts"


def artifact_path(symbol: str, timeframe: int) -> Path:
    normalized = symbol.upper().replace("/", "_")
    return ARTIFACTS_DIR / f"xgboost_{normalized}_{int(timeframe)}d.json"


def ensure_artifacts_dir() -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def save_model(
    model: xgb.XGBRegressor,
    symbol: str,
    timeframe: int,
    metadata: dict | None = None,
) -> Path:
    ensure_artifacts_dir()
    path = artifact_path(symbol, timeframe)
    model.save_model(path)

    meta_path = path.with_suffix(".meta.json")
    meta_path.write_text(
        json.dumps(
            {
                "symbol": symbol.upper(),
                "timeframe": int(timeframe),
                **(metadata or {}),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return path


def load_model(symbol: str, timeframe: int) -> xgb.XGBRegressor | None:
    path = artifact_path(symbol, timeframe)
    if not path.exists():
        return None

    model = xgb.XGBRegressor()
    model.load_model(path)
    return model


def load_metadata(symbol: str, timeframe: int) -> dict:
    meta_path = artifact_path(symbol, timeframe).with_suffix(".meta.json")
    if not meta_path.exists():
        return {}
    return json.loads(meta_path.read_text(encoding="utf-8"))


def model_is_fresh(symbol: str, timeframe: int, max_age_hours: int = 24) -> bool:
    path = artifact_path(symbol, timeframe)
    if not path.exists():
        return False

    age_seconds = os.path.getmtime(path)
    import time

    return (time.time() - age_seconds) < max_age_hours * 3600
