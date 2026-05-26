import type { ExtensionMessage } from "../shared/types";
import { resolveEarnings } from "../shared/earnings/cache";
import { fetchFinvizMetrics } from "../shared/metrics/finviz";
import { fetchScreenerMetrics } from "../shared/metrics/screener";
import { fetchYahooMetrics } from "../shared/metrics/yahoo";
import {
  deliverLoadToSidePanel,
  openSidePanel,
  PAGE_CONTEXT_SESSION_KEY,
} from "../shared/side-panel";
import {
  clearAllData,
  clearEarningsCache,
  clearResearchData,
  clearSessionData,
  getSettings,
  getStorage,
} from "../shared/storage";
import {
  exportData,
  importDataMerge,
  importDataReplace,
  validateImportPayload,
} from "../shared/export-import";

if (chrome.sidePanel?.setPanelBehavior) {
  chrome.runtime.onInstalled.addListener(() => {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  });
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "GET_STORAGE":
        sendResponse(await getStorage());
        break;
      case "FETCH_EARNINGS": {
        const { symbol, market, pageEarnings } = message.payload as {
          symbol: string;
          market: import("../shared/types").Market;
          pageEarnings?: string | null;
        };
        const settings = await getSettings();
        const result = await resolveEarnings(
          symbol,
          market,
          pageEarnings ?? null,
          settings.earningsCache,
        );
        sendResponse(result);
        break;
      }
      case "EXPORT_DATA": {
        const payload = await exportData(true);
        sendResponse(payload);
        break;
      }
      case "IMPORT_DATA": {
        const { payload, mode } = message.payload as {
          payload: unknown;
          mode: "merge" | "replace";
        };
        const validated = validateImportPayload(payload);
        if (mode === "replace") await importDataReplace(validated);
        else await importDataMerge(validated);
        sendResponse({ ok: true });
        break;
      }
      case "CLEAR_DATA": {
        const { tier } = message.payload as {
          tier: "earnings" | "session" | "research" | "all";
        };
        if (tier === "earnings") await clearEarningsCache();
        else if (tier === "session") await clearSessionData();
        else if (tier === "research") await clearResearchData();
        else await clearAllData();
        sendResponse({ ok: true });
        break;
      }
      case "FETCH_METRICS": {
        const { symbol: mSym, market: mMkt } = message.payload as {
          symbol: string;
          market: import("../shared/types").Market;
        };
        const [yahooResult, screenerResult, finvizResult] = await Promise.all([
          fetchYahooMetrics(mSym, mMkt),
          fetchScreenerMetrics(mSym, mMkt), // null for non-India
          mMkt === "US" ? fetchFinvizMetrics(mSym) : Promise.resolve(null),
        ]);
        if (!yahooResult && !screenerResult && !finvizResult) {
          sendResponse(null);
          break;
        }
        // Screener.in is authoritative for India-specific fields;
        // Finviz fills US fields when Yahoo's summary endpoint is unavailable.
        const base = yahooResult?.metrics ?? finvizResult?.metrics ?? {
          price: null, changePercent: null, marketCap: null, pe: null, dividendYield: null,
          week52Range: null, roe: null, roce: null, debtEquity: null,
          promoterHolding: null, earningsDate: null, dividendDate: null,
          filingDate: null, source: "screener",
        };
        const merged = {
          metrics: {
            ...base,
            ...(finvizResult && {
              price: base.price ?? finvizResult.metrics.price,
              changePercent: base.changePercent ?? finvizResult.metrics.changePercent,
              marketCap: base.marketCap ?? finvizResult.metrics.marketCap,
              pe: base.pe ?? finvizResult.metrics.pe,
              week52Range: base.week52Range ?? finvizResult.metrics.week52Range,
              roe: base.roe ?? finvizResult.metrics.roe,
              debtEquity: base.debtEquity ?? finvizResult.metrics.debtEquity,
              earningsDate: base.earningsDate ?? finvizResult.metrics.earningsDate,
              source: yahooResult ? `${base.source}+finviz` : finvizResult.metrics.source,
            }),
            ...(screenerResult && {
              roce: screenerResult.roce ?? base.roce,
              promoterHolding: screenerResult.promoterHolding ?? base.promoterHolding,
              roe: screenerResult.roe ?? base.roe,
              marketCap: screenerResult.marketCap ?? base.marketCap,
              pe: screenerResult.pe ?? base.pe,
              debtEquity: screenerResult.debtEquity ?? base.debtEquity,
              source: yahooResult ? "yahoo+screener" : "screener",
            }),
          },
          companyName: yahooResult?.companyName ?? finvizResult?.companyName ?? null,
        };
        sendResponse(merged);
        break;
      }
      case "PING":
        sendResponse({ ok: true });
        break;
      case "OPEN_SIDE_PANEL_LOAD": {
        const payload = message.payload as {
          symbol: string;
          market: import("../shared/types").Market;
          tab?: import("../shared/types").TabId;
        };
        sendResponse(
          await deliverLoadToSidePanel(payload, sender.tab?.windowId),
        );
        break;
      }
      case "OPEN_SIDE_PANEL": {
        const ok = await openSidePanel(sender.tab?.windowId);
        sendResponse({ ok });
        break;
      }
      case "SET_PAGE_CONTEXT_SESSION": {
        const payload = message.payload as {
          ctx: import("../shared/types").DetectedPageContext;
          extracted: import("../shared/types").ExtractedMetrics | null;
        };
        await chrome.storage.session.set({
          [PAGE_CONTEXT_SESSION_KEY]: {
            ctx: payload.ctx,
            extracted: payload.extracted,
            ts: Date.now(),
          },
        });
        sendResponse({ ok: true });
        break;
      }
      default:
        break;
    }
  })().catch((err) => {
    console.error("[VV Overlay SW]", err);
    sendResponse({ error: String(err) });
  });
  return true;
});

export {};
