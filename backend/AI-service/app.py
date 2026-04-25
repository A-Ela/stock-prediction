from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from model import predict_stock

app = FastAPI()

class Request(BaseModel):
    symbol: str
    timeframe: int

@app.post("/predict")
def predict(req: Request):
    try:
        result = predict_stock(req.symbol, req.timeframe)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))