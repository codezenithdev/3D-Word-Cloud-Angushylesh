from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl


app = FastAPI(title="3D Word Cloud API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: HttpUrl


class WordItem(BaseModel):
    word: str
    weight: float


class AnalyzeResponse(BaseModel):
    words: list[WordItem]
    title: str | None = None


def _stub_analyze_response(url: str) -> AnalyzeResponse:
    """Phase 1 placeholder: fixed keywords so the frontend can be exercised without crawling."""
    words = [
        WordItem(word="discovery", weight=1.0),
        WordItem(word="research", weight=0.88),
        WordItem(word="analysis", weight=0.76),
        WordItem(word="context", weight=0.65),
        WordItem(word="signal", weight=0.54),
        WordItem(word="narrative", weight=0.48),
        WordItem(word="impact", weight=0.41),
    ]
    return AnalyzeResponse(
        words=words,
        title=f"(stub) no crawl yet - requested: {url}",
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest) -> AnalyzeResponse:
    """
    Phase 1: returns deterministic stub data (plan milestone 1).
    Phase 2: fetch HTML, extract text (trafilatura), score terms (TF-IDF).
    """
    return _stub_analyze_response(str(body.url))
