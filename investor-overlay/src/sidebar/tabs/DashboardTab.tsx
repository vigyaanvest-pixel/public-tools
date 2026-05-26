import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { MARKET_LABELS, WATCHLIST_STATUSES } from "../../shared/constants";
import type { Market, WatchlistEntry } from "../../shared/types";

const STATUS_COLORS: Record<string, string> = {
  Watching:    "#4ade80",
  Researching: "#22d3ee",
  Ready:       "#4ade80",
  Passed:      "#8b92a8",
  Avoid:       "#f87171",
};

const STATUS_CLASS: Record<string, string> = {
  Watching:    "s-watching",
  Researching: "s-researching",
  Ready:       "s-ready",
  Passed:      "s-passed",
  Avoid:       "s-avoid",
};

function ReviewDate({ dateStr }: { dateStr: string }) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return <span className="dash-review-date">{dateStr}</span>;
  const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const day = parseInt(parts[2], 10);
  const mon = monthNames[parseInt(parts[1], 10) - 1] ?? parts[1];
  return (
    <div className="dash-review-date">
      <div className="drdate-day">{day}</div>
      <div className="drdate-mon">{mon}</div>
    </div>
  );
}

export function DashboardTab() {
  const { allWatchlist, loadSymbol } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const total = allWatchlist.length;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of WATCHLIST_STATUSES) c[s] = 0;
    for (const w of allWatchlist) c[w.status] = (c[w.status] ?? 0) + 1;
    return c;
  }, [allWatchlist]);

  const grouped = useMemo(() => {
    const g: Record<string, WatchlistEntry[]> = {};
    for (const s of WATCHLIST_STATUSES) g[s] = [];
    for (const w of allWatchlist) (g[w.status] ??= []).push(w);
    return g;
  }, [allWatchlist]);

  const overdue = useMemo(
    () => allWatchlist.filter((w) => w.reviewDate && w.reviewDate < today),
    [allWatchlist, today],
  );

  const upcoming = useMemo(
    () =>
      allWatchlist
        .filter((w) => w.reviewDate && w.reviewDate >= today && w.reviewDate <= in60Days)
        .sort((a, b) => (a.reviewDate ?? "").localeCompare(b.reviewDate ?? "")),
    [allWatchlist, today, in60Days],
  );

  const byMarket = useMemo(() => {
    const m: Record<string, number> = {};
    for (const w of allWatchlist) m[w.market] = (m[w.market] ?? 0) + 1;
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [allWatchlist]);

  if (total === 0) {
    return (
      <p className="text-sm text-vv-muted">
        No stocks saved yet. Add a stock from the Watchlist tab.
      </p>
    );
  }

  return (
    <div>
      {/* Summary stat row */}
      <div className="section-hdr" style={{ marginBottom: 8 }}>Summary</div>
      <div className="dash-stat-row">
        <div className="dash-stat">
          <div className="dash-stat-num text-vv-text">{total}</div>
          <div className="dash-stat-lbl">Total</div>
        </div>
        {WATCHLIST_STATUSES.map((s) => (
          <div key={s} className="dash-stat">
            <div className="dash-stat-num" style={{ color: STATUS_COLORS[s] }}>
              {counts[s]}
            </div>
            <div className="dash-stat-lbl">{s}</div>
          </div>
        ))}
      </div>

      {/* Distribution bar */}
      <div style={{ marginBottom: 16 }}>
        <div className="dash-bar-track">
          {WATCHLIST_STATUSES.map((s) => {
            const pct = (counts[s] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={s}
                className="dash-bar-seg"
                style={{ width: `${pct}%`, background: STATUS_COLORS[s] }}
                title={`${s}: ${counts[s]}`}
              />
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "3px 10px",
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: "var(--vv-text3)",
          }}
        >
          {WATCHLIST_STATUSES.filter((s) => counts[s] > 0).map((s) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: STATUS_COLORS[s],
                  display: "inline-block",
                }}
              />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Overdue reviews */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            className="section-hdr"
            style={{ marginBottom: 8, color: "var(--vv-warn)" }}
          >
            <span>⚑ Overdue Reviews</span>
            <span style={{ fontSize: 9 }}>{overdue.length}</span>
          </div>
          <div className="dash-card">
            {overdue.map((w) => (
              <button
                key={`${w.symbol}-${w.market}`}
                type="button"
                className="dash-row"
                onClick={() => void loadSymbol(w.symbol, w.market, "watchlist", "snapshot")}
              >
                <span className="dash-sym">{w.symbol}</span>
                <span className="dash-meta">{w.companyName !== w.symbol ? w.companyName : ""}</span>
                <span className="dash-market">{MARKET_LABELS[w.market]}</span>
                <span className="dash-review" style={{ color: "var(--vv-warn)" }}>
                  {w.reviewDate}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* By status swimlanes */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-hdr" style={{ marginBottom: 10 }}>By Status</div>
        {WATCHLIST_STATUSES.map((status) => {
          const entries = grouped[status];
          if (entries.length === 0) return null;
          return (
            <div key={status} style={{ marginBottom: 10 }}>
              <div
                className="section-hdr"
                style={{
                  marginBottom: 5,
                  color: STATUS_COLORS[status],
                  fontSize: 9,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: STATUS_COLORS[status],
                      display: "inline-block",
                    }}
                  />
                  {status}
                </span>
                <span>{counts[status]}</span>
              </div>
              <div className="dash-card">
                {entries.map((w) => (
                  <button
                    key={`${w.symbol}-${w.market}`}
                    type="button"
                    className="dash-row"
                    onClick={() => void loadSymbol(w.symbol, w.market, "watchlist", "snapshot")}
                  >
                    <span className="dash-sym">{w.symbol}</span>
                    <span className="dash-meta">
                      {w.companyName !== w.symbol ? w.companyName : ""}
                    </span>
                    <span className="dash-market">{MARKET_LABELS[w.market]}</span>
                    {w.reviewDate && (
                      <span className="dash-review">{w.reviewDate}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming reviews — 60 days */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="section-hdr" style={{ marginBottom: 8 }}>
            <span>Upcoming Reviews</span>
            <span style={{ fontSize: 9, color: "var(--vv-text3)" }}>60 days</span>
          </div>
          <div className="dash-card">
            {upcoming.map((w) => (
              <button
                key={`${w.symbol}-${w.market}`}
                type="button"
                className="dash-review-row"
                onClick={() => void loadSymbol(w.symbol, w.market, "watchlist", "events")}
              >
                <ReviewDate dateStr={w.reviewDate ?? ""} />
                <div className="dash-review-detail">
                  <div className="drdetail-sym">
                    {w.symbol}
                    <span className={`wl-status ${STATUS_CLASS[w.status] ?? "s-passed"}`} style={{ padding: "2px 6px", fontSize: 9 }}>
                      {w.status}
                    </span>
                  </div>
                  {w.companyName && w.companyName !== w.symbol && (
                    <div className="drdetail-note">{w.companyName}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* By market */}
      <div>
        <div className="section-hdr" style={{ marginBottom: 10 }}>By Market</div>
        {byMarket.map(([mkt, count]) => {
          const pct = (count / total) * 100;
          return (
            <div key={mkt} className="dash-mkt-row">
              <span className="dash-mkt-label">{MARKET_LABELS[mkt as Market] ?? mkt}</span>
              <div className="dash-mkt-bar-wrap">
                <div className="dash-mkt-bar" style={{ width: `${pct}%` }} />
              </div>
              <span className="dash-mkt-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
