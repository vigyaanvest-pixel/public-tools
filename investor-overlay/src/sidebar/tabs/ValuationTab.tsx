import { useApp } from "../context/AppContext";
import { MetricCard } from "../components/MetricCard";
import { hasMetricValues } from "../../shared/metrics/select";

export function ValuationTab() {
  const { symbol, market, extracted, detectedContext, apiMetrics, notes, setNotes, saveNotesNow } =
    useApp();
  if (!symbol || !market) return <p className="text-sm text-vv-muted">No symbol loaded.</p>;

  const pageMatch =
    detectedContext?.symbol?.toUpperCase() === symbol.toUpperCase() &&
    detectedContext?.site !== "none";

  // Prefer page-extracted data; fall back to background API fetch
  const live = pageMatch && hasMetricValues(extracted, ["pe", "marketCap", "dividendYield"])
    ? extracted
    : null;
  const metrics = live ?? apiMetrics;
  const metricsSource = live ? detectedContext?.site : (apiMetrics?.source ?? null);
  const val = (v: string | null | undefined) => v ?? null;

  return (
    <div>
      <div className="section-hdr" style={{ marginBottom: 10 }}>
        <span>Valuation metrics</span>
        {metricsSource ? (
          <span style={{ color: "var(--vv-accent)", textTransform: "none", letterSpacing: 0, fontSize: 9 }}>
            ↑ {metricsSource}
          </span>
        ) : (
          <span style={{ textTransform: "none", letterSpacing: 0, fontSize: 9 }}>
            loading…
          </span>
        )}
      </div>

      <div className="metric-grid">
        <MetricCard label="P/E (TTM)" value={val(metrics?.pe)} />
        <MetricCard label="Market Cap" value={val(metrics?.marketCap)} />
        <MetricCard label="Div. Yield" value={val(metrics?.dividendYield)} />
      </div>

      <div style={{ marginTop: 4 }}>
        <label>
          <span className="field-label">Valuation note</span>
          <textarea
            className="field-input"
            rows={5}
            placeholder="Your valuation observations…"
            value={notes.valuationNote}
            onChange={(e) => setNotes({ ...notes, valuationNote: e.target.value })}
            onBlur={() => void saveNotesNow()}
          />
        </label>
      </div>
    </div>
  );
}
