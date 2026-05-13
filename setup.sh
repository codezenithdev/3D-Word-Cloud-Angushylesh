#!/usr/bin/env bash
# macOS: install dependencies and start API + Vite dev server together.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is written for macOS only (per project brief)." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required on PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required on PATH." >&2
  exit 1
fi

echo "==> Python venv (.venv)"
python3 -m venv .venv
# shellcheck source=/dev/null
source .venv/bin/activate

echo "==> pip install (backend)"
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

echo "==> npm install (frontend)"
(cd frontend && npm install)

UVICORN="${ROOT}/.venv/bin/uvicorn"

echo "==> Starting servers (Ctrl+C stops both)"
echo "    API:    http://127.0.0.1:8000"
echo "    UI:     http://127.0.0.1:5173"
trap 'kill 0' INT TERM EXIT

(cd backend && exec "${UVICORN}" app.main:app --reload --host 0.0.0.0 --port 8000) &
(cd frontend && exec npm run dev -- --host 127.0.0.1 --port 5173) &

wait
