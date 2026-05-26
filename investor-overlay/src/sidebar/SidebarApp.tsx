import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useApp } from "./context/AppContext";
import { SymbolSwitcher } from "./components/SymbolSwitcher";
import { TAB_LABELS, TAB_ORDER, APP_NAME, VIGYAANVEST_URL } from "../shared/constants";
import { MARKET_LABELS, FLOAT_BUTTON_LABEL } from "../shared/constants";
import type { Market, TabId } from "../shared/types";
import { SnapshotTab } from "./tabs/SnapshotTab";
import { ValuationTab } from "./tabs/ValuationTab";
import { QualityTab } from "./tabs/QualityTab";
import { TechnicalTab } from "./tabs/TechnicalTab";
import { EventsTab } from "./tabs/EventsTab";
import { ThesisTab } from "./tabs/ThesisTab";
import { WatchlistTab } from "./tabs/WatchlistTab";
import { DashboardTab } from "./tabs/DashboardTab";
import { BrandIcon } from "./components/BrandIcon";

const TAB_SHORT: Record<TabId, string> = {
  snapshot: "Snap",
  valuation: "Val",
  quality: "Quality",
  technical: "Chart",
  events: "Events",
  thesis: "Thesis",
  watchlist: "Watch",
  dashboard: "Dash",
};

const TAB_COMPONENTS: Record<TabId, () => ReactElement> = {
  snapshot: SnapshotTab,
  valuation: ValuationTab,
  quality: QualityTab,
  technical: TechnicalTab,
  events: EventsTab,
  thesis: ThesisTab,
  watchlist: WatchlistTab,
  dashboard: DashboardTab,
};

export function SidebarApp({
  surface = "overlay",
}: {
  surface?: "overlay" | "sidepanel";
}) {
  const app = useApp();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [draftSymbol, setDraftSymbol] = useState("");
  const [draftMarket, setDraftMarket] = useState<Market>("US");
  const isSidePanel = surface === "sidepanel";

  useEffect(() => {
    setDraftSymbol(app.symbol ?? "");
    setDraftMarket(app.market ?? "US");
  }, [app.symbol, app.market]);

  if (!app.open && !isSidePanel) return null;

  if (!app.open && isSidePanel) {
    return (
      <div className="flex h-screen w-full flex-col bg-vv-panel p-4 text-vv-text">
        <div className="mb-4 flex items-center gap-2">
          <BrandIcon size={32} radius={8} />
          <span className="font-syne font-bold text-sm">{APP_NAME}</span>
        </div>
        <SymbolSwitcher
          symbol={draftSymbol}
          market={draftMarket}
          onSymbolChange={setDraftSymbol}
          onMarketChange={setDraftMarket}
          onLoad={() => {
            void app.loadSymbol(draftSymbol, draftMarket, "manual");
            app.openSidebar();
          }}
        />
        <p className="mt-4 text-xs text-vv-text3">
          Enter a symbol to start researching. Works on any page — no stock site required.
        </p>
      </div>
    );
  }

  const ActiveTab = TAB_COMPONENTS[app.activeTab];

  const pageMatch =
    app.detectedContext?.symbol?.toUpperCase() === app.symbol?.toUpperCase() &&
    app.detectedContext?.site !== "none";
  const livePrice = pageMatch ? app.extracted?.price ?? null : null;
  const displayCompanyName =
    app.companyName && app.companyName.toUpperCase() !== app.symbol?.toUpperCase()
      ? app.companyName
      : "";

  const panelClassName = isSidePanel
    ? "vv-sidebar-panel flex h-screen w-full flex-col text-vv-text"
    : "vv-sidebar-panel fixed right-0 top-0 z-[2147483647] flex h-full flex-col text-vv-text shadow-2xl";

  return (
    <div
      className={panelClassName}
      style={
        isSidePanel
          ? undefined
          : { width: app.collapsed ? 48 : 380, pointerEvents: "auto" }
      }
    >
      {app.collapsed ? (
        <button
          type="button"
          className="vv-float-btn"
          onClick={() => app.setCollapsed(false)}
          title="Expand sidebar"
        >
          {FLOAT_BUTTON_LABEL}
        </button>
      ) : (
        <>
          {/* Header */}
          <header
            className="bg-vv-surface2 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--vv-border)" }}
          >
            <button
              type="button"
              className="flex min-w-0 flex-col items-start gap-0.5 text-left"
              onClick={() => {
                setDraftSymbol(app.symbol ?? "");
                setDraftMarket(app.market ?? "US");
                setSwitcherOpen((o) => !o);
              }}
              title="Click to change symbol"
            >
              {app.symbol ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className="font-syne leading-none"
                      style={{ fontWeight: 800, fontSize: 18 }}
                    >
                      {app.symbol}
                    </span>
                    {displayCompanyName ? (
                      <span
                        className="truncate text-xs text-vv-muted"
                        style={{ maxWidth: isSidePanel ? 180 : 150 }}
                      >
                        {displayCompanyName}
                      </span>
                    ) : null}
                  </span>
                  <span className="market-badge">{MARKET_LABELS[app.market!]}</span>
                  <span className="symbol-change-cue" aria-hidden="true">Change</span>
                  <span className="symbol-chevron" aria-hidden="true">v</span>
                </div>
              ) : (
                <span className="text-sm text-vv-muted">
                  Load symbol <span className="symbol-chevron" aria-hidden="true">v</span>
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {livePrice && (
                <span className="font-mono text-xs text-vv-accent">{livePrice}</span>
              )}
              <div className="flex gap-1">
                {!isSidePanel && (
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-vv-muted hover:bg-vv-surface3"
                    style={{ background: "var(--vv-surface3)", border: "1px solid var(--vv-border)" }}
                    onClick={() => app.setCollapsed(true)}
                    title="Collapse"
                  >
                    −
                  </button>
                )}
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-vv-muted"
                  style={{ background: "var(--vv-surface3)", border: "1px solid var(--vv-border)" }}
                  onClick={app.closeSidebar}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
          </header>

          {/* Symbol switcher dropdown */}
          {switcherOpen ? (
            <div
              className="bg-vv-surface2 p-3"
              style={{ borderBottom: "1px solid var(--vv-border)" }}
            >
              <SymbolSwitcher
                compact
                symbol={draftSymbol}
                market={draftMarket}
                onSymbolChange={setDraftSymbol}
                onMarketChange={setDraftMarket}
                onLoad={() => {
                  void app.loadSymbol(draftSymbol, draftMarket, "manual");
                  setSwitcherOpen(false);
                }}
              />
            </div>
          ) : null}

          {/* Tab bar */}
          <nav
            className="bg-vv-surface2 flex"
            style={{
              borderBottom: "1px solid var(--vv-border)",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {TAB_ORDER.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`vv-tab${app.activeTab === tab ? " vv-tab-active" : ""}`}
                title={TAB_LABELS[tab]}
                onClick={() => void app.setActiveTab(tab)}
              >
                {TAB_SHORT[tab]}
              </button>
            ))}
          </nav>

          {/* Content */}
          <main
            className="flex-1 overflow-y-auto p-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--vv-surface3) transparent" }}
          >
            <ActiveTab />
          </main>

          {/* Footer */}
          <footer
            className="px-4 py-2 text-xs text-vv-text3 privacy-msg"
            style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderBottom: "none", borderTop: "1px solid var(--vv-border)" }}
          >
            <span>Data saved locally.</span>
            <a
              className="vv-footer-link"
              href={VIGYAANVEST_URL}
              target="_blank"
              rel="noreferrer"
            >
              Powered by VigyaanVest.com
            </a>
          </footer>
        </>
      )}
    </div>
  );
}
