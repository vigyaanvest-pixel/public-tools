import { useApp } from "../context/AppContext";
import { MetricCard } from "../components/MetricCard";
import { displayValue } from "../../shared/format";

export function EventsTab() {
  const {
    symbol,
    market,
    notes,
    setNotes,
    saveNotesNow,
    earningsDate,
    earningsSourceLabel,
    earningsStale,
    extracted,
    detectedContext,
  } = useApp();

  if (!symbol || !market)
    return <p className="text-sm text-vv-muted">No symbol loaded.</p>;

  const pageMatch =
    detectedContext?.symbol?.toUpperCase() === symbol.toUpperCase() &&
    detectedContext?.site !== "none";

  return (
    <div>
      {/* Earnings date */}
      <div className="section-hdr" style={{ marginBottom: 10 }}>
        <span>Earnings</span>
        {earningsSourceLabel && (
          <span
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 9,
              color: earningsStale ? "var(--vv-warn)" : "var(--vv-accent)",
            }}
          >
            {earningsSourceLabel}
          </span>
        )}
      </div>

      <div className="metric-grid-2" style={{ marginBottom: 12 }}>
        <div className="metric-card">
          <div className="metric-label">Earnings date</div>
          <div className={`metric-value${earningsDate ? "" : " dash"}`}>
            {displayValue(earningsDate)}
          </div>
        </div>
        {pageMatch && extracted?.filingDate ? (
          <div className="metric-card">
            <div className="metric-label">Filing date</div>
            <div className="metric-value">{extracted.filingDate}</div>
          </div>
        ) : (
          <div className="metric-card">
            <div className="metric-label">Filing date</div>
            <div className="metric-value dash">—</div>
          </div>
        )}
      </div>

      {earningsStale && (
        <p className="text-xs" style={{ color: "var(--vv-warn)", marginBottom: 12 }}>
          May be outdated — verify at source before relying on this date.
        </p>
      )}

      {/* Review date */}
      <label style={{ display: "block", marginBottom: 12 }}>
        <span className="field-label">Review date</span>
        <input
          type="date"
          className="field-input field-input-sm date-input"
          style={{ minHeight: "auto", resize: "none" }}
          value={notes.reviewDate ?? ""}
          onChange={(e) => setNotes({ ...notes, reviewDate: e.target.value })}
          onBlur={() => void saveNotesNow()}
        />
      </label>

      {/* Event notes */}
      {(
        [
          ["nextEventToWatch",      "Next event to watch",   "e.g. Earnings call, product launch…"],
          ["resultExpectationNote", "Result expectation",    "What do you expect the results to show?"],
          ["eventNoteManual",       "Event note",            "Additional notes…"],
          ["followUpAction",        "Follow-up action",      "What will you do after the event?"],
        ] as const
      ).map(([key, label, placeholder]) => (
        <label key={key} style={{ display: "block", marginBottom: 12 }}>
          <span className="field-label">{label}</span>
          <textarea
            className="field-input"
            rows={2}
            placeholder={placeholder}
            value={notes[key] ?? ""}
            onChange={(e) => setNotes({ ...notes, [key]: e.target.value })}
            onBlur={() => void saveNotesNow()}
          />
        </label>
      ))}
    </div>
  );
}
