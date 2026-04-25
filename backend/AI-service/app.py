from fastapi import FastAPI
from pydantic import BaseModel
from model import predict_stock

app = FastAPI()

class Request(BaseModel):
    symbol: str
    timeframe: int

@app.post("/predict")
def predict(req: Request):
    result = predict_stock(req.symbol, req.timeframe)
    return result