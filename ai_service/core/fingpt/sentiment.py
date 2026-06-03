import logging
import os
import re
from functools import lru_cache
from typing import Iterable

from core.fingpt.finbert_engine import analyze_news_texts as analyze_with_finbert

logger = logging.getLogger(__name__)

FINGPT_BASE_MODEL = os.getenv("FINGPT_BASE_MODEL", "THUDM/chatglm2-6b")
FINGPT_PEFT_MODEL = os.getenv(
    "FINGPT_PEFT_MODEL",
    "oliverwang15/FinGPT_ChatGLM2_Sentiment_Instruction_LoRA_FT",
)
MAX_NEWS_FOR_SENTIMENT = int(os.getenv("FINGPT_MAX_NEWS", "5"))
SENTIMENT_ENGINE = os.getenv("SENTIMENT_ENGINE", "auto").strip().lower()

INSTRUCTION_TEMPLATE = (
    "Instruction: What is the sentiment of this news? "
    "Please choose an answer from {negative/neutral/positive}\n"
    "Input: {text}\n"
    "Answer: "
)

LABEL_TO_SCORE = {
    "positive": 1.0,
    "neutral": 0.0,
    "negative": -1.0,
}


def _resolve_engine() -> str:
    """FinBERT is fastest on both CPU and GPU; FinGPT only when explicitly requested."""
    if SENTIMENT_ENGINE == "fingpt":
        return "fingpt"
    return "finbert"


def _parse_label(raw: str) -> str:
    text = (raw or "").strip().lower()
    text = text.split("\n")[0].strip()
    text = re.sub(r"[^a-z]", "", text)

    if "positive" in text and "negative" not in text:
        return "positive"
    if "negative" in text:
        return "negative"
    if "neutral" in text:
        return "neutral"
    return "neutral"


@lru_cache(maxsize=1)
def _load_fingpt_model():
    """Load FinGPT v3 (ChatGLM2 + LoRA) once per process."""
    import torch
    from peft import PeftModel
    from transformers import AutoModel, AutoTokenizer

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    logger.info("Loading FinGPT sentiment model on %s", device)
    tokenizer = AutoTokenizer.from_pretrained(
        FINGPT_BASE_MODEL, trust_remote_code=True
    )
    base = AutoModel.from_pretrained(
        FINGPT_BASE_MODEL,
        trust_remote_code=True,
        torch_dtype=dtype,
        low_cpu_mem_usage=True,
        device_map="auto" if device == "cuda" else None,
    )
    if device == "cpu":
        base = base.to(device)

    model = PeftModel.from_pretrained(base, FINGPT_PEFT_MODEL)
    model.eval()
    return tokenizer, model, device


def _score_text_fingpt(text: str) -> tuple[str, float]:
    import torch

    tokenizer, model, device = _load_fingpt_model()
    prompt = INSTRUCTION_TEMPLATE.format(text=text[:1500])

    tokens = tokenizer(
        [prompt],
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512,
    )
    tokens = {key: value.to(device) for key, value in tokens.items()}

    with torch.no_grad():
        output = model.generate(
            **tokens,
            max_new_tokens=8,
            do_sample=False,
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)
    answer = decoded.split("Answer:")[-1].strip()
    label = _parse_label(answer)
    return label, LABEL_TO_SCORE[label]


def _analyze_with_fingpt(texts: Iterable[str]) -> dict:
    snippets = [text.strip() for text in texts if text and text.strip()]
    if not snippets:
        snippets = ["General market sentiment is mixed with no major headlines."]

    snippets = snippets[:MAX_NEWS_FOR_SENTIMENT]
    labels: list[str] = []
    scores: list[float] = []

    for snippet in snippets:
        label, score = _score_text_fingpt(snippet)
        labels.append(label)
        scores.append(score)

    return {
        "sentimentScore": float(sum(scores) / len(scores)),
        "sentimentLabel": max(set(labels), key=labels.count),
        "articleCount": len(snippets),
        "labels": labels,
        "sentimentEngine": "fingpt",
    }


def analyze_news_texts(texts: Iterable[str]) -> dict:
    engine = _resolve_engine()

    if engine == "finbert":
        return analyze_with_finbert(texts)

    try:
        return _analyze_with_fingpt(texts)
    except Exception as exc:
        logger.warning("FinGPT unavailable, using FinBERT fallback: %s", exc)
        result = analyze_with_finbert(texts)
        result["sentimentEngine"] = "finbert-fallback"
        return result


def analyze_articles(articles: list[dict]) -> dict:
    texts = [article.get("text") or article.get("title", "") for article in articles]
    return analyze_news_texts(texts)
