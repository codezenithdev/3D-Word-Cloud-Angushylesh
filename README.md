# 3D Word Cloud (Angushylesh)

Small full-stack demo: paste a **news or article URL**, the **FastAPI** backend downloads the page, extracts text with **trafilatura**, ranks terms with **TF-IDF (scikit-learn)**, and the **React + TypeScript** frontend shows an interactive **3D word cloud** (React Three Fiber) plus a 2D keyword list.

Suggested GitHub repo name: **`3D-Word-Cloud-Angushylesh`**.

## Prerequisites (macOS)

- **macOS** (the bundled setup script targets macOS only)
- **Python 3.10+** (`python3` on your `PATH`)
- **Node.js 18+** and **npm**

## Libraries

**Backend**

- FastAPI, Uvicorn, httpx, trafilatura, scikit-learn, NumPy, Pydantic

**Frontend**

- Vite, React, TypeScript, Three.js, `@react-three/fiber`, `@react-three/drei`

## Quick start (one script)

From the repository root:

```bash
chmod +x setup.sh
./setup.sh
```

This creates `.venv/`, installs Python dependencies from `backend/requirements.txt`, runs `npm install` in `frontend/`, then starts:

| Service | URL |
|--------|-----|
| API (FastAPI) | http://127.0.0.1:8000 |
| UI (Vite) | http://127.0.0.1:5173 |

Open the UI URL, pick a sample article or paste your own, and click **Analyze**.

### Manual run (same ports)

Terminal A:

```bash
cd backend
python3 -m venv ../.venv && source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal B:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Optional: set `VITE_API_URL` (e.g. in `frontend/.env.local`) if the API is not on `http://127.0.0.1:8000`.

## API

`POST /analyze`

Request body:

```json
{ "url": "https://example.com/article" }
```

Success response:

```json
{
  "words": [{ "word": "example", "weight": 1.0 }],
  "title": "Optional page title when available"
}
```

Errors use HTTP **400** (bad URL / extraction / no keywords) or **422** (invalid JSON / invalid URL field) with FastAPI’s `detail` field.

`GET /health` returns `{"status":"ok"}`.

## Tests

With the virtualenv activated from the repo root:

```bash
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
cd backend
python -m pytest tests -v
```

## Notes / limitations

- **Paywalls**, **cookie walls**, and **JavaScript-only** article bodies may fail extraction; the implementation favors clarity over covering every site.
- Very large HTML responses are rejected (see `MAX_BYTES` in `backend/app/extract.py`).
- The 3D view caps the number of labels (default **52**) for performance.

## Project layout

```text
backend/app/     FastAPI app, crawl + NLP
frontend/src/    Vite React UI + WordCloud3D
setup.sh         macOS: install + run both servers
```
