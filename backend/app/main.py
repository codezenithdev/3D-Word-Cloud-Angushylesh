from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from app.extract import ExtractionError, fetch_and_extract
from app.nlp import score_terms

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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest) -> AnalyzeResponse:
    url_str = str(body.url)
    try:
        text, title = fetch_and_extract(url_str)
    except ExtractionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    words = score_terms(text)
    if not words:
        raise HTTPException(
            status_code=400,
            detail="Could not derive keywords from extracted text",
        )
    return AnalyzeResponse(words=[WordItem(**w) for w in words], title=title)
