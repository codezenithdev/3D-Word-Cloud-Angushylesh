import { useCallback, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

type Sample = { url: string; label: string };

const SAMPLES: Sample[] = [
  {
    url: "https://en.wikipedia.org/wiki/Word_cloud",
    label: "Wikipedia — Word cloud",
  },
  {
    url: "https://en.wikipedia.org/wiki/Natural_language_processing",
    label: "Wikipedia — NLP",
  },
  {
    url: "https://github.blog/news-insights/the-library/open-source-license-basics-for-developers/",
    label: "GitHub Blog — Licenses",
  },
  {
    url: "https://www.bbc.com/news/science-environment-68219673",
    label: "BBC — Science",
  },
  {
    url: "https://en.wikipedia.org/wiki/FastAPI",
    label: "Wikipedia — FastAPI",
  },
];

type AnalyzeResponse = {
  words: { word: string; weight: number }[];
  title?: string | null;
};

type ApiErrorBody = {
  detail?: unknown;
};

function formatApiError(data: ApiErrorBody, fallback: string): string {
  const { detail } = data;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (typeof item === "object" && item !== null && "msg" in item) {
        return String((item as { msg: unknown }).msg);
      }
      return JSON.stringify(item);
    });
    return parts.join("; ");
  }
  if (detail !== undefined && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return fallback;
}

export default function App() {
  const datalistId = useId();
  const statusId = useId();
  const [url, setUrl] = useState(SAMPLES[0]?.url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runAnalyze = useCallback(async (articleUrl: string) => {
    const trimmed = articleUrl.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowRawJson(false);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
        signal: ac.signal,
      });
      const data = (await res.json()) as AnalyzeResponse & ApiErrorBody;
      if (!res.ok) {
        throw new Error(formatApiError(data, res.statusText));
      }
      setResult(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof TypeError) {
        setError(
          e.message.includes("fetch")
            ? "Network error — is the API running on port 8000?"
            : e.message,
        );
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (abortRef.current === ac) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, []);

  const onSubmit = useCallback(() => {
    void runAnalyze(url);
  }, [runAnalyze, url]);

  const onSample = useCallback(
    (sampleUrl: string) => {
      setUrl(sampleUrl);
      void runAnalyze(sampleUrl);
    },
    [runAnalyze],
  );

  return (
    <div className="app">
      <header className="header">
        <h1>3D Word Cloud</h1>
        <p className="subtitle">
          Paste a URL or pick a sample. The API returns ranked keywords; a 3D
          scene comes in the next milestone.
        </p>
      </header>

      <section className="controls">
        <label htmlFor="article-url">Article URL</label>
        <div className="url-row">
          <input
            id="article-url"
            type="url"
            list={datalistId}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="https://..."
            autoComplete="url"
            disabled={loading}
            aria-busy={loading}
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <span className="btn-inner">
                <span className="spinner" aria-hidden />
                Analyzing…
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
        <datalist id={datalistId}>
          {SAMPLES.map((s) => (
            <option key={s.url} value={s.url} label={s.label} />
          ))}
        </datalist>

        <div className="samples" role="group" aria-label="Sample articles">
          <span className="samples-label">Samples (fill URL and run):</span>
          <div className="sample-chips">
            {SAMPLES.map((s) => (
              <button
                key={s.url}
                type="button"
                className="chip"
                title={s.url}
                onClick={() => onSample(s.url)}
                disabled={loading}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div
        id={statusId}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading ? "Loading analysis." : error ? `Error: ${error}` : ""}
      </div>

      {error ? (
        <div className="banner error" role="alert">
          <strong className="banner-title">Something went wrong</strong>
          <p className="banner-body">{error}</p>
        </div>
      ) : null}

      <section className="output" aria-label="Analysis results">
        {result ? (
          <>
            <div className="result-card">
              <h2 className="result-heading">Article</h2>
              <p className="result-title">
                {result.title?.trim() || "No title returned"}
              </p>
              <p className="result-meta">
                {result.words.length} keywords · weights normalized to the top
                term
              </p>
            </div>

            <div className="result-card">
              <h2 className="result-heading">Keywords</h2>
              <ul className="keyword-cloud" aria-label="Keywords by weight">
                {result.words.map(({ word, weight }) => (
                  <li
                    key={word}
                    className="keyword-pill"
                    style={
                      {
                        "--w": String(weight),
                      } as CSSProperties
                    }
                  >
                    <span className="keyword-text">{word}</span>
                    <span className="keyword-weight" aria-hidden>
                      {weight.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="raw-json-block">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowRawJson((v) => !v)}
                aria-expanded={showRawJson}
              >
                {showRawJson ? "Hide" : "Show"} raw JSON
              </button>
              {showRawJson ? (
                <pre className="json">{JSON.stringify(result, null, 2)}</pre>
              ) : null}
            </div>
          </>
        ) : (
          <p className="placeholder">
            Run an analysis to see the article title, weighted keywords, and
            optional raw <code>POST /analyze</code> JSON.
          </p>
        )}
      </section>
    </div>
  );
}
