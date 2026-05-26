import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { buildChartLinks } from "../../shared/source-links";
import { SETUP_TYPES } from "../../shared/constants";
import { tradingViewSymbol } from "../../shared/symbol-resolver";
import { getSettings } from "../../shared/storage";
import type { Market } from "../../shared/types";

export function TechnicalTab() {
  const { symbol, market, notes, setNotes, saveNotesNow } = useApp();
  const [embedEnabled, setEmbedEnabled] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setEmbedEnabled(s.tradingViewEmbedEnabled));
  }, []);

  if (!symbol || !market) return <p className="text-vv-muted text-sm">No symbol loaded.</p>;

  const chartLinks = buildChartLinks(symbol, market);

  return (
    <div>
      {/* Chart links */}
      <div className="section-hdr" style={{ marginBottom: 8 }}>Chart links</div>
      <div className="link-chips" style={{ marginBottom: 16 }}>
        {chartLinks.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="link-chip"
          >
            ↗ {l.label}
          </a>
        ))}
      </div>

      {embedEnabled ? <TradingViewEmbed symbol={symbol} market={market} /> : null}

      {/* Setup type chips */}
      <div style={{ marginBottom: 14 }}>
        <div className="field-label">Setup type</div>
        <div className="status-chips">
          <button
            type="button"
            className={`status-chip${!notes.setupType ? " active" : ""}`}
            onClick={() => {
              setNotes({ ...notes, setupType: undefined });
              void saveNotesNow();
            }}
          >
            —
          </button>
          {SETUP_TYPES.map((s) => (
            <button
              key={s}
              type="button"
              className={`status-chip${notes.setupType === s ? " active" : ""}`}
              onClick={() => {
                setNotes({ ...notes, setupType: s as typeof notes.setupType });
                void saveNotesNow();
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {(
        [
          ["trendNote",      "Trend note",        "e.g. Uptrend above 50MA, consolidating…"],
          ["entryWatchNote", "Entry / watch note", "e.g. Watch for breakout above $120…"],
          ["stopRiskNote",   "Stop / risk note",   "e.g. Stop below $108 (5% risk)…"],
          ["timeframeNote",  "Timeframe note",     "e.g. Weekly chart, swing trade 4–8 weeks…"],
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

function TradingViewEmbed({
  symbol,
  market,
}: {
  symbol: string;
  market: Market;
}) {
  const tvSym = encodeURIComponent(tradingViewSymbol(symbol, market));
  const src = `https://www.tradingview.com/widgetembed/?symbol=${tvSym}&interval=D&theme=dark&style=1&locale=en&hide_top_toolbar=1&save_image=0&hide_legend=0`;
  return (
    <iframe
      title="TradingView chart"
      src={src}
      className="w-full rounded"
      style={{ height: 200, border: "1px solid var(--vv-border)", marginBottom: 16 }}
      sandbox="allow-scripts allow-same-origin allow-popups"
      referrerPolicy="no-referrer"
    />
  );
}
