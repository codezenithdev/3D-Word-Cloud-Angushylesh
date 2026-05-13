from __future__ import annotations

import pytest

from app.nlp import score_terms


def test_score_terms_returns_normalized_weights() -> None:
    text = (
        "Climate policy drives energy research and technology adoption. "
        * 15
        + "Science discovery depends on data and careful analysis. " * 15
    )
    words = score_terms(text, top_n=25)
    assert len(words) >= 3
    top = words[0]["weight"]
    assert top == pytest.approx(1.0)
    for row in words:
        assert 0 < row["weight"] <= 1.0
        assert len(row["word"]) >= 3
