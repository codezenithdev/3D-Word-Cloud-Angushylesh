import { useCallback, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const SAMPLE_URLS = [
  "https://en.wikipedia.org/wiki/Word_cloud",
  "https://en.wikipedia.org/wiki/Natural_language_processing",
  "https://github.blog/news-insights/the-library/open-source-license-basics-for-developers/",
  "https://www.bbc.com/news/science-environment-68219673",
];

type AnalyzeResponse = {
  words: { word: string; weight: number }[];
  title?: string | null;
};

export default function App() {
  const [url, setUrl] = useState(SAMPLE_URLS[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as AnalyzeResponse & { detail?: unknown };
      if (!res.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail ?? res.statusText);
        throw new Error(detail);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [url]);

  return (
    <div className="app">
      <header className="header">
        <h1>3D Word Cloud</h1>
        <p className="subtitle">
          Milestone 1 (plan): the backend <code>POST /analyze</code> currently
          returns <strong>stub</strong> keyword data so this UI can call the API
          end-to-end. The URL is accepted but not crawled yet (Phase 2). 3D
          visualization is a later milestone.
        </p>
      </header>

      <section className="controls">
        <label htmlFor="url">Article URL</label>
        <div className="url-row">
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            autoComplete="url"
          />
          <button type="button" onClick={analyze} disabled={loading || !url}>
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        <div className="samples">
          <span>Sample links:</span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample}
              type="button"
              className="chip"
              onClick={() => setUrl(sample)}
            >
              {new URL(sample).hostname}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="banner error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="output">
        <h2>API response</h2>
        {result ? (
          <pre className="json">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <p className="placeholder">
            Run an analysis to see <code>words</code> and optional{" "}
            <code>title</code> from <code>POST /analyze</code>.
          </p>
        )}
      </section>
    </div>
  );
}
