import { useApp } from "../context/AppContext";
import { MetricCard } from "../components/MetricCard";
import { hasMetricValues } from "../../shared/metrics/select";

export function QualityTab() {
  const { symbol, market, extracted, detectedContext, apiMetrics, notes, setNotes, saveNotesNow } =
    useApp();
  if (!symbol || !market) return <p className="text-sm text-vv-muted">No symbol loaded.</p>;

  const pageMatch =
    detectedContext?.symbol?.toUpperCase() === symbol.toUpperCase() &&
    detectedContext?.site !== "none";

  const live = pageMatch && hasMetricValues(extracted, ["roe", "roce", "debtEquity", "promoterHolding"])
    ? extracted
    : null;
  const metrics = live ?? apiMetrics;
  const metricsSource = live ? detectedContext?.site : (apiMetrics?.source ?? null);
  const val = (v: string | null | undefined) => v ?? null;

  return (
    <div>
      <div className="section-hdr" style={{ marginBottom: 10 }}>
        <span>Quality metrics</span>
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
        <MetricCard label="ROE" value={val(metrics?.roe)} />
        <MetricCard label="ROCE" value={val(metrics?.roce)} />
        <MetricCard label="Debt / Equity" value={val(metrics?.debtEquity)} />
        <MetricCard label="Promoter %" value={val(metrics?.promoterHolding)} />
      </div>

      <div style={{ marginTop: 4 }}>
        <label>
          <span className="field-label">Quality note</span>
          <textarea
            className="field-input"
            rows={5}
            placeholder="Your quality observations…"
            value={notes.qualityNote}
            onChange={(e) => setNotes({ ...notes, qualityNote: e.target.value })}
            onBlur={() => void saveNotesNow()}
          />
        </label>
      </div>
    </div>
  );
}
