from __future__ import annotations

import httpx
import trafilatura

MAX_BYTES = 2_000_000
TIMEOUT_S = 15.0


class ExtractionError(Exception):
    """Raised when the article cannot be fetched or extracted."""


def fetch_and_extract(url: str) -> tuple[str, str | None]:
    """
    Returns (plain_text, optional_title).
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; 3DWordCloudBot/1.0; "
            "+https://example.com/bot)"
        ),
    }
    try:
        with httpx.Client(
            timeout=TIMEOUT_S,
            follow_redirects=True,
            headers=headers,
        ) as client:
            response = client.get(url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ExtractionError(f"Failed to download page: {exc}") from exc

    content = response.content
    if len(content) > MAX_BYTES:
        raise ExtractionError("Response body too large")

    try:
        html = response.text
    except UnicodeDecodeError as exc:
        raise ExtractionError("Could not decode page as text") from exc

    text = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_tables=False,
        no_fallback=False,
    )
    if not text or len(text.strip()) < 80:
        raise ExtractionError("Could not extract enough article text from page")

    metadata = trafilatura.extract_metadata(html, default_url=url)
    title = metadata.title if metadata else None
    return text.strip(), title
