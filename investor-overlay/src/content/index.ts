import type { ExtensionMessage } from "../shared/types";
import { DEFAULT_SETTINGS, APP_NAME, FLOAT_BUTTON_LABEL } from "../shared/constants";
import type { AppSettings } from "../shared/types";
import { getSettings } from "../shared/storage";
import { detectPageContext } from "./detectors";
import { extractMetrics } from "./extractors";
import { hookSpaNavigation } from "./spa-navigation";
import { setPendingPageContext } from "./page-context-bridge";

let cachedSettings: AppSettings = { ...DEFAULT_SETTINGS };

function refreshPageContext(): void {
  const ctx = detectPageContext(window.location.href);
  const extracted =
    cachedSettings.pageExtractionEnabled &&
    ctx.site !== "none" &&
    ctx.symbol
      ? extractMetrics(ctx)
      : null;
  setPendingPageContext(ctx, extracted);
  ensureFloatingButton(
    cachedSettings.showFloatingButton && ctx.site !== "none",
  );
}

function openSidePanelWithSymbol(payload: {
  symbol: string;
  market: import("../shared/types").Market;
  tab?: import("../shared/types").TabId;
}): void {
  chrome.runtime.sendMessage({
    type: "OPEN_SIDE_PANEL_LOAD",
    payload,
  });
}

function maybeAutoOpenSidebar(ctx: ReturnType<typeof detectPageContext>): void {
  if (
    !cachedSettings.sidebarDefaultOpen ||
    ctx.site === "none" ||
    !ctx.symbol ||
    !ctx.market
  ) {
    return;
  }
  openSidePanelWithSymbol({
    symbol: ctx.symbol,
    market: ctx.market,
  });
}

function ensureFloatingButton(show: boolean): void {
  let btn = document.getElementById("vv-float-btn");
  if (!show) {
    btn?.remove();
    return;
  }
  if (btn) return;
  btn = document.createElement("button");
  btn.id = "vv-float-btn";
  btn.textContent = FLOAT_BUTTON_LABEL;
  btn.title = APP_NAME;
  btn.setAttribute(
    "style",
    [
      "position:fixed",
      "top:50%",
      "right:0",
      "transform:translateY(-50%)",
      "z-index:2147483646",
      "width:36px",
      "height:36px",
      "border:none",
      "border-radius:8px 0 0 8px",
      "background:linear-gradient(135deg,#4ade80,#22d3ee)",
      "color:#0d0f14",
      "font-family:Syne,sans-serif",
      "font-weight:800",
      "cursor:pointer",
      "box-shadow:-4px 0 16px rgba(74,222,128,0.45)",
      "animation:none",
    ].join(";"),
  );
  btn.addEventListener("click", () => {
    const ctx = detectPageContext(window.location.href);
    if (ctx.symbol && ctx.market) {
      openSidePanelWithSymbol({
        symbol: ctx.symbol,
        market: ctx.market,
      });
      return;
    }
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  });
  document.documentElement.appendChild(btn);
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ ok: true });
      return true;
    }
    if (message.type === "GET_PAGE_CONTEXT") {
      const ctx = detectPageContext(window.location.href);
      sendResponse(ctx);
      return true;
    }
    if (message.type === "OPEN_SIDEBAR" || message.type === "LOAD_SYMBOL") {
      const payload = message.payload as {
        symbol: string;
        market: import("../shared/types").Market;
        tab?: import("../shared/types").TabId;
      };
      chrome.runtime.sendMessage(
        { type: "OPEN_SIDE_PANEL_LOAD", payload },
        (response) => sendResponse(response ?? { ok: false }),
      );
      return true;
    }
    if (message.type === "TOGGLE_SIDEBAR") {
      chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" }, (response) =>
        sendResponse(response ?? { ok: true }),
      );
      return true;
    }
    return false;
  },
);

async function init(): Promise<void> {
  try {
    cachedSettings = await getSettings();
  } catch (err) {
    console.error("[investor-overlay] settings load failed", err);
  }

  refreshPageContext();
  hookSpaNavigation(refreshPageContext);

  const ctx = detectPageContext(window.location.href);
  queueMicrotask(() => {
    maybeAutoOpenSidebar(ctx);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.settings) return;
    cachedSettings = {
      ...cachedSettings,
      ...(changes.settings.newValue as AppSettings),
    };
    refreshPageContext();
  });
}

init().catch(console.error);
