import type { Market, TabId } from "./types";

export const PAGE_CONTEXT_SESSION_KEY = "pageContextForSidebar";
export const PENDING_SIDEBAR_LOAD_KEY = "pendingSidebarLoad";

export async function deliverLoadToSidePanel(
  payload: {
    symbol: string;
    market: Market;
    tab?: TabId;
  },
  windowId?: number,
): Promise<{ ok: boolean; error?: string }> {
  const symbol = payload.symbol.trim().toUpperCase();
  if (!symbol) {
    return { ok: false, error: "Enter a symbol first." };
  }

  if (!chrome.sidePanel?.open) {
    return {
      ok: false,
      error: "Side panel is not supported in this browser version.",
    };
  }

  try {
    await chrome.storage.session.set({
      [PENDING_SIDEBAR_LOAD_KEY]: {
        symbol,
        market: payload.market,
        tab: payload.tab,
        ts: Date.now(),
      },
    });
  } catch {
    /* session may be unavailable */
  }

  try {
    let targetWindowId = windowId;
    if (targetWindowId === undefined) {
      const win = await chrome.windows.getCurrent();
      targetWindowId = win.id;
    }
    if (targetWindowId === undefined) {
      return { ok: false, error: "No browser window found." };
    }
    await chrome.sidePanel.open({ windowId: targetWindowId });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not open the sidebar panel." };
  }
}

export async function openSidePanel(windowId?: number): Promise<boolean> {
  if (!chrome.sidePanel?.open) return false;
  try {
    let targetWindowId = windowId;
    if (targetWindowId === undefined) {
      const win = await chrome.windows.getCurrent();
      targetWindowId = win.id;
    }
    if (targetWindowId === undefined) return false;
    await chrome.sidePanel.open({ windowId: targetWindowId });
    return true;
  } catch {
    return false;
  }
}
