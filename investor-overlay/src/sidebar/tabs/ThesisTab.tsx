import { useApp } from "../context/AppContext";

const THESIS_FIELDS = [
  ["interest",              "Why interested",         "What drew you to this stock?"],
  ["bullCase",              "Bull case",              "Key reasons it could do well…"],
  ["bearCase",              "Bear case",              "Main risks / what could go wrong…"],
  ["buyTrigger",            "Buy trigger",            "What would make you actually buy?"],
  ["sellOrAvoidReason",     "Sell / avoid reason",    "What would make you sell or skip it?"],
  ["disconfirmingEvidence", "Disconfirming evidence", "What would prove your thesis wrong?"],
] as const;

export function ThesisTab() {
  const { symbol, market, notes, setNotes, saveNotesNow } = useApp();
  if (!symbol || !market)
    return <p className="text-sm text-vv-muted">No symbol loaded.</p>;

  return (
    <div>
      {THESIS_FIELDS.map(([key, label, placeholder]) => (
        <label key={key} style={{ display: "block", marginBottom: 12 }}>
          <span className="field-label">{label}</span>
          <textarea
            className="field-input"
            rows={3}
            placeholder={placeholder}
            value={notes.thesis[key]}
            onChange={(e) =>
              setNotes({
                ...notes,
                thesis: { ...notes.thesis, [key]: e.target.value },
              })
            }
            onBlur={() => void saveNotesNow()}
          />
        </label>
      ))}
    </div>
  );
}
