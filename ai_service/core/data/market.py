import logging
import os
from typing import Any

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

DEFAULT_HISTORY_PERIOD = os.getenv("MARKET_HISTORY_PERIOD", "1y")


def fetch_price_history(symbol: str, period: str = DEFAULT_HISTORY_PERIOD) -> pd.DataFrame:
    """Download OHLCV history from Yahoo Finance."""
    ticker = yf.Ticker(symbol.upper())
    hist = ticker.history(period=period, auto_adjust=True)

    if hist is None or hist.empty:
        raise ValueError(f"No price history found for {symbol}")

    frame = hist.reset_index()
    frame.columns = [str(col).lower().replace(" ", "_") for col in frame.columns]

    if "date" not in frame.columns and "datetime" in frame.columns:
        frame = frame.rename(columns={"datetime": "date"})

    required = {"date", "open", "high", "low", "close", "volume"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"History for {symbol} is missing columns: {sorted(missing)}")

    frame["date"] = pd.to_datetime(frame["date"], utc=True).dt.tz_localize(None)
    frame = frame.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    return frame[["date", "open", "high", "low", "close", "volume"]].reset_index(drop=True)


def _extract_article_text(article: dict[str, Any]) -> str:
    content = article.get("content") or {}
    title = (
        article.get("title")
        or content.get("title")
        or article.get("headline")
        or ""
    )
    summary = (
        article.get("summary")
        or content.get("summary")
        or content.get("description")
        or article.get("description")
        or ""
    )
    text = " ".join(part.strip() for part in (title, summary) if part and part.strip())
    return text.strip()


def fetch_recent_news(symbol: str, max_articles: int = 3) -> list[dict[str, str]]:
    """Collect recent financial news headlines and summaries for a symbol."""
    ticker = yf.Ticker(symbol.upper())
    raw_news = getattr(ticker, "news", None) or []

    articles: list[dict[str, str]] = []
    for item in raw_news[:max_articles]:
        if not isinstance(item, dict):
            continue

        text = _extract_article_text(item)
        if not text:
            continue

        articles.append(
            {
                "title": item.get("title") or item.get("headline") or text[:120],
                "text": text,
                "publisher": item.get("publisher") or item.get("source") or "unknown",
            }
        )

    if not articles:
        logger.info("No Yahoo news for %s; using market outlook placeholder", symbol)
        articles.append(
            {
                "title": f"{symbol.upper()} market outlook",
                "text": (
                    f"{symbol.upper()} stock market outlook, recent trading activity, "
                    "and investor sentiment."
                ),
                "publisher": "fallback",
            }
        )

    return articles
