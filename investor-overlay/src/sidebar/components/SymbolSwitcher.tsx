import type { Market } from "../../shared/types";
import { MARKET_LABELS, MARKETS } from "../../shared/constants";

interface Props {
  symbol: string;
  market: Market;
  onSymbolChange: (symbol: string) => void;
  onMarketChange: (market: Market) => void;
  onLoad: () => void;
  compact?: boolean;
}

export function SymbolSwitcher({
  symbol,
  market,
  onSymbolChange,
  onMarketChange,
  onLoad,
  compact = false,
}: Props) {
  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      <div className="flex gap-2">
        <input
          className="field-input field-input-sm flex-1"
          style={{ minHeight: "auto", resize: "none", borderRadius: 7, padding: "7px 10px" }}
          placeholder="Symbol, e.g. MU"
          maxLength={12}
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onLoad()}
        />
        <select
          className="field-input field-input-sm"
          style={{ minHeight: "auto", resize: "none", width: 90, flexShrink: 0, borderRadius: 7, padding: "7px 8px" }}
          value={market}
          onChange={(e) => onMarketChange(e.target.value as Market)}
        >
          {MARKETS.map((m) => (
            <option key={m} value={m}>
              {MARKET_LABELS[m]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn-primary"
        onClick={onLoad}
      >
        Load in Sidebar
      </button>
    </div>
  );
}
