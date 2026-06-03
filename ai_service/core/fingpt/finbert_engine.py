import logging
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

FINBERT_MODEL = "ProsusAI/finbert"
_ready = False


def _best_device() -> str:
    import torch

    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


@lru_cache(maxsize=1)
def _load_finbert():
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    device = _best_device()
    logger.info("Loading FinBERT on %s", device)

    tokenizer = AutoTokenizer.from_pretrained(FINBERT_MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(FINBERT_MODEL)
    model.eval()
    model.to(device)

    if device == "cpu":
        torch.set_num_threads(min(4, os.cpu_count() or 4))

    return tokenizer, model, device


def warmup() -> None:
    """Pre-load FinBERT so the first /predict request is fast."""
    global _ready
    _load_finbert()
    _ready = True
    logger.info("FinBERT warmup complete")


def is_ready() -> bool:
    return _ready


def _score_text(text: str) -> tuple[str, float]:
    import torch

    tokenizer, model, device = _load_finbert()
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=False,
    )
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.inference_mode():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1).tolist()[0]

    negative, neutral, positive = probs
    score = float(positive - negative)
    if positive >= negative and positive >= neutral:
        label = "positive"
    elif negative >= neutral:
        label = "negative"
    else:
        label = "neutral"
    return label, score


def analyze_news_texts(texts) -> dict:
    """One FinBERT pass on combined headlines (fastest path)."""
    snippets = [text.strip() for text in texts if text and text.strip()]
    if not snippets:
        snippets = ["General market sentiment is mixed with no major headlines."]

    combined = " ".join(snippets[:3])[:2000]
    label, score = _score_text(combined)

    return {
        "sentimentScore": score,
        "sentimentLabel": label,
        "articleCount": len(snippets),
        "labels": [label],
        "sentimentEngine": f"finbert-{_best_device()}",
    }
