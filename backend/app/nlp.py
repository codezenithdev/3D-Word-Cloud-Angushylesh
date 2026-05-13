from __future__ import annotations

import re
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer

MAX_WORDS = 60
MIN_WORD_LEN = 3


def _tokenize_words(text: str) -> list[str]:
    raw = re.findall(r"[a-zA-Z][a-zA-Z\-']{2,}", text.lower())
    return raw


def score_terms(text: str, top_n: int = MAX_WORDS) -> list[dict[str, Any]]:
    """
    Single-document TF-IDF: treat each sentence as a pseudo-document
    so idf differentiates informative terms.
    """
    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    if len(sentences) < 3:
        sentences = [
            " ".join(chunk)
            for chunk in _chunks(_tokenize_words(text), size=40)
        ]
    if not sentences:
        return []

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        max_features=500,
        ngram_range=(1, 1),
        min_df=1,
        max_df=0.95,
        token_pattern=r"(?u)\b[a-z][a-z\-']{2,}\b",
    )
    try:
        matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return []

    scores = matrix.sum(axis=0).A1
    terms = vectorizer.get_feature_names_out()
    pairs = [(term, float(score)) for term, score in zip(terms, scores) if score > 0]
    pairs.sort(key=lambda x: x[1], reverse=True)

    if not pairs:
        return []

    max_score = pairs[0][1]
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for word, score in pairs:
        if len(word) < MIN_WORD_LEN or word in seen:
            continue
        seen.add(word)
        out.append({"word": word, "weight": round(score / max_score, 4)})
        if len(out) >= top_n:
            break
    return out


def _chunks(items: list[str], size: int) -> list[list[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]
