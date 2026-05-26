import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles/app.css";
import { SymbolSwitcher } from "../sidebar/components/SymbolSwitcher";
import { BrandIcon } from "../sidebar/components/BrandIcon";
import {
  APP_NAME,
  MARKET_LABELS,
  PRIVACY_NOTE,
  RECENT_DISPLAY_COUNT,
  VIGYAANVEST_URL,
} from "../shared/constants";
import type { DetectedPageContext, Market } from "../shared/types";
import {
  getSessionState,
  getSettings,
  upsertWatchlistEntry,
} from "../shared/storage";
import { getActiveTabId, sendTabMessage } from "../shared/symbol-resolver";
import { deliverLoadToSidePanel } from "../shared/side-panel";
import { applyThemeClass } from "../shared/theme";
import { nowIso } from "../shared/format";

function Popup() {
  const [symbol, setSymbol] = useState("");
  const [market, setMarket] = useState<Market>("US");
  const [detected, setDetected] = useState<DetectedPageContext | null>(null);
  const [recent, setRecent] = useState<Array<{ symbol: string; market: Market }>>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    document.body.classList.add("theme-dark");
    getSettings().then((s) => applyThemeClass(document.body, s));
    (async () => {
      const tabId = await getActiveTabId();
      if (tabId) {
        const ctx = await sendTabMessage<DetectedPageContext>(tabId, {
          type: "GET_PAGE_CONTEXT",
        });
        if (ctx?.symbol) {
          setDetected(ctx);
          setSymbol(ctx.symbol);
          setMarket(ctx.market ?? "US");
        }
      }
      const session = await getSessionState();
      setRecent(session.recentSymbols.slice(0, RECENT_DISPLAY_COUNT));
    })();
  }, []);

  const openSidebar = async (tab?: import("../shared/types").TabId) => {
    setStatus("");
    const result = await deliverLoadToSidePanel({ symbol, market, tab });
    if (result.ok) {
      window.close();
      return;
    }
    setStatus(result.error ?? "Could not open sidebar.");
  };

  const addToWatchlist = async () => {
    if (!symbol.trim()) return;
    await upsertWatchlistEntry({
      symbol: symbol.toUpperCase(),
      companyName: symbol.toUpperCase(),
      market,
      source: detected?.site ?? "manual",
      status: "Watching",
      tags: [],
      reviewDate: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    setStatus("Added to watchlist.");
  };

  return (
    <div style={{ width: 300, background: "var(--vv-panel)", color: "var(--vv-text)", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,211,238,0.08))",
          borderBottom: "1px solid var(--vv-border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <BrandIcon size={28} radius={7} />
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }}>
          {APP_NAME}
        </span>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Detected chip */}
        {detected?.symbol ? (
          <div className="detected-chip">
            <div className="detected-dot" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>
                {detected.symbol}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--vv-muted)", marginTop: 1 }}>
                {detected.site}
              </div>
            </div>
            <span className="source-tag">{MARKET_LABELS[detected.market ?? "US"]}</span>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--vv-muted)" }}>
            No stock detected on this page.
          </div>
        )}

        {/* Search */}
        <SymbolSwitcher
          symbol={symbol}
          market={market}
          onSymbolChange={setSymbol}
          onMarketChange={setMarket}
          onLoad={() => void openSidebar()}
        />

        {/* Actions */}
        {detected?.symbol ? (
          <>
            <button type="button" className="btn-primary" onClick={() => void openSidebar()}>
              ⊞ &nbsp;Open Research Sidebar
            </button>
            <button type="button" className="btn-secondary" onClick={() => void addToWatchlist()}>
              ＋ &nbsp;Add to Watchlist
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => void openSidebar()}>
            ⊞ &nbsp;Open Sidebar
          </button>
        )}

        <button
          type="button"
          className="btn-secondary"
          onClick={() => void openSidebar("watchlist")}
        >
          ☰ &nbsp;Open Watchlist
        </button>

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--vv-text3)",
                marginBottom: 6,
              }}
            >
              Recently researched
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recent.map((r) => (
                <button
                  key={`${r.symbol}-${r.market}`}
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "4px 0",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    color: "var(--vv-accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onClick={() => {
                    setSymbol(r.symbol);
                    setMarket(r.market);
                    void openSidebar();
                  }}
                >
                  {r.symbol}
                  <span className="market-badge">{MARKET_LABELS[r.market]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status message */}
        {status && (
          <p
            style={{
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: status.includes("Could not") || status.includes("Enter") || status.includes("Open a")
                ? "var(--vv-warn)"
                : "var(--vv-accent)",
              margin: 0,
            }}
          >
            {status}
          </p>
        )}
      </div>

      {/* Privacy note */}
      <div style={{ padding: "0 16px 14px" }}>
        <div className="privacy-msg">
          <span>{PRIVACY_NOTE}</span>
          <a
            className="vv-footer-link"
            href={VIGYAANVEST_URL}
            target="_blank"
            rel="noreferrer"
          >
            Powered by VigyaanVest.com
          </a>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
