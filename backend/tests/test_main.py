"""API smoke tests (no network; fetch/NLP mocked where needed)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.extract import ExtractionError
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_analyze_validation_missing_url(client: TestClient) -> None:
    resp = client.post("/analyze", json={})
    assert resp.status_code == 422


def test_analyze_validation_bad_url(client: TestClient) -> None:
    resp = client.post("/analyze", json={"url": "not-a-valid-url"})
    assert resp.status_code == 422


def test_analyze_extraction_error(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(_url: str) -> tuple[str, str | None]:
        raise ExtractionError("could not fetch")

    monkeypatch.setattr("app.main.fetch_and_extract", boom)
    resp = client.post(
        "/analyze",
        json={"url": "https://example.com/article"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "could not fetch"


def test_analyze_no_keywords(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.main.fetch_and_extract",
        lambda _u: ("short text", None),
    )
    monkeypatch.setattr("app.main.score_terms", lambda _t: [])
    resp = client.post(
        "/analyze",
        json={"url": "https://example.com/article"},
    )
    assert resp.status_code == 400
    assert "keywords" in resp.json()["detail"].lower()


def test_analyze_success_mocked(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_fetch(_url: str) -> tuple[str, str | None]:
        parts = [
            f"Climate policy shapes energy markets and technology adoption year {i}."
            for i in range(25)
        ]
        parts += [
            f"Research discovery in science and growth dynamics segment {i}."
            for i in range(25)
        ]
        return "\n".join(parts), "Synthetic article"

    monkeypatch.setattr("app.main.fetch_and_extract", fake_fetch)
    resp = client.post(
        "/analyze",
        json={"url": "https://example.com/article"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Synthetic article"
    assert len(data["words"]) >= 3
    for item in data["words"]:
        assert "word" in item and "weight" in item
        assert isinstance(item["word"], str)
        assert isinstance(item["weight"], float)
