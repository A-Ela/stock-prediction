from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import yfinance as yf

# Load financial sentiment model
tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")

def get_sentiment(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model(**inputs)

    scores = torch.nn.functional.softmax(outputs.logits, dim=1)
    return scores.tolist()[0]  # [neg, neutral, pos]

def predict_stock(symbol, days):
    stock = yf.Ticker(symbol)
    hist = stock.history(period="3mo")

    last_price = hist["Close"].iloc[-1]

    # Fake news input (you can later replace with real news API)
    news_text = f"{symbol} stock market outlook and performance"

    sentiment = get_sentiment(news_text)

    # simple prediction logic combining sentiment + trend
    trend = hist["Close"].pct_change().mean()

    sentiment_score = sentiment[2] - sentiment[0]

    predicted_price = last_price * (1 + trend + sentiment_score * 0.05)

    confidence = abs(sentiment_score)

    return {
        "symbol": symbol,
        "predictedPrice": float(predicted_price),
        "confidence": float(min(confidence, 1)),
        "currentPrice": float(last_price)
    }