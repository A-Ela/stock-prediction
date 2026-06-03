import logging
import sys
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model import predict_stock

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_warmup_started = False
_warmup_done = False
_warmup_error: str | None = None


def _run_warmup():
    global _warmup_done, _warmup_error
    try:
        from core.fingpt.finbert_engine import warmup

        warmup()
        _warmup_done = True
        logger.info("AI service ready for predictions")
    except Exception as exc:
        _warmup_error = str(exc)
        logger.exception("Warmup failed: %s", exc)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _warmup_started
    if not _warmup_started:
        _warmup_started = True
        threading.Thread(target=_run_warmup, daemon=True).start()
    yield


app = FastAPI(
    title="Stock Prediction AI Service",
    description="FinBERT/FinGPT sentiment + XGBoost price forecasting",
    version="2.1.0",
    lifespan=lifespan,
)


class PredictRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=12)
    timeframe: int = Field(..., ge=1, le=30)


@app.get("/health")
def health():
    return {"status": "ok", "pipeline": ["sentiment", "feature_engineering", "xgboost"]}


@app.get("/ready")
def ready():
    if _warmup_error:
        raise HTTPException(status_code=503, detail=f"Warmup failed: {_warmup_error}")
    if not _warmup_done:
        raise HTTPException(status_code=503, detail="Models still loading")
    return {"ready": True}


@app.post("/predict")
def predict(req: PredictRequest):
    if not _warmup_done:
        if _warmup_error:
            raise HTTPException(status_code=503, detail=f"Service not ready: {_warmup_error}")
        raise HTTPException(status_code=503, detail="Models still loading, retry shortly")

    try:
        return predict_stock(req.symbol, req.timeframe)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed for %s", req.symbol)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
