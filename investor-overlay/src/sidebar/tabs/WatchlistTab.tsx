import { useApp } from "../context/AppContext";
import { MARKET_LABELS, WATCHLIST_STATUSES } from "../../shared/constants";
import type { WatchlistStatus } from "../../shared/types";
import { nowIso } from "../../shared/format";

const STATUS_CLASS: Record<string, string> = {
  Watching:    "s-watching",
  Researching: "s-researching",
  Ready:       "s-ready",
  Passed:      "s-passed",
  Avoid:       "s-avoid",
};

export function WatchlistTab() {
  const {
    symbol,
    market,
    watchlistEntry,
    notes,
    setNotes,
    saveNotesNow,
    allWatchlist,
    addToWatchlist,
    updateWatchlistEntry,
    removeFromWatchlist,
    loadSymbol,
  } = useApp();

  return (
    <div>
      {/* Current symbol panel */}
      {symbol && market ? (
        <div
          className="bg-vv-surface2 rounded"
          style={{ border: "1px solid var(--vv-border)", padding: "14px", marginBottom: 20 }}
        >
          <div
            className="font-syne"
            style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}
          >
            {symbol}
            <span
              className="market-badge"
              style={{ marginLeft: 8 }}
            >
              {MARKET_LABELS[market]}
            </span>
          </div>

          {watchlistEntry ? (
            <>
              {/* Status chips */}
              <div style={{ marginBottom: 12 }}>
                <div className="field-label">Status</div>
                <div className="status-chips">
                  {WATCHLIST_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`status-chip${watchlistEntry.status === s ? " active" : ""}`}
                      onClick={() =>
                        void updateWatchlistEntry({
                          ...watchlistEntry,
                          status: s as WatchlistStatus,
                          updatedAt: nowIso(),
                        })
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 12 }}>
                <div className="field-label">
                  Tags{" "}
                  <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--vv-text3)" }}>
                    (comma-separated)
                  </span>
                </div>
                <input
                  className="field-input field-input-sm"
                  style={{ minHeight: "auto", resize: "none" }}
                  placeholder="e.g. AI, semiconductor, growth"
                  defaultValue={watchlistEntry.tags.join(", ")}
                  onBlur={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    void updateWatchlistEntry({ ...watchlistEntry, tags, updatedAt: nowIso() });
                  }}
                />
              </div>

              {/* Review date */}
              <label style={{ display: "block", marginBottom: 12 }}>
                <span className="field-label">Review date</span>
                <input
                  type="date"
                  className="field-input field-input-sm date-input"
                  value={notes.reviewDate ?? watchlistEntry.reviewDate ?? ""}
                  onChange={(e) => {
                    const reviewDate = e.target.value;
                    setNotes({ ...notes, reviewDate });
                    void updateWatchlistEntry({
                      ...watchlistEntry,
                      reviewDate,
                      updatedAt: nowIso(),
                    });
                  }}
                  onBlur={() => void saveNotesNow()}
                />
              </label>

              {watchlistEntry.tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {watchlistEntry.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              )}

              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "var(--vv-danger)",
                  padding: 0,
                }}
                onClick={() => void removeFromWatchlist()}
              >
                × Remove from watchlist
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void addToWatchlist()}
            >
              + Add to watchlist
            </button>
          )}
        </div>
      ) : null}

      {/* Full watchlist */}
      <div className="section-hdr" style={{ marginBottom: 10 }}>
        <span>Saved symbols</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--vv-text3)" }}>
          {allWatchlist.length}
        </span>
      </div>

      {allWatchlist.length === 0 ? (
        <p className="text-sm text-vv-muted">No symbols saved yet.</p>
      ) : (
        <div>
          {allWatchlist.map((w) => (
            <button
              key={`${w.symbol}-${w.market}`}
              type="button"
              className="watchlist-row"
              onClick={() => void loadSymbol(w.symbol, w.market, "watchlist", "snapshot")}
            >
              <span className="wl-sym">{w.symbol}</span>
              <span className={`wl-status ${STATUS_CLASS[w.status] ?? "s-passed"}`}>
                {w.status}
              </span>
              {w.tags.length > 0 && (
                <span style={{ flex: 1, overflow: "hidden", display: "flex", gap: 3, flexWrap: "nowrap" }}>
                  {w.tags.slice(0, 2).map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </span>
              )}
              {w.reviewDate && <span className="wl-date">{w.reviewDate}</span>}
              <span className="wl-arrow">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
