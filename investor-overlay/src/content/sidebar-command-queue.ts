import type { Market, TabId } from "../shared/types";
import { sidebarController } from "../sidebar/context/AppContext";

export interface SidebarLoadRequest {
  symbol: string;
  market: Market;
  tab?: TabId;
}

let pending: SidebarLoadRequest | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushAttempts = 0;
const MAX_FLUSH_ATTEMPTS = 40;

function clearFlushTimer(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export function requestSidebarLoad(request: SidebarLoadRequest): boolean {
  const symbol = request.symbol.trim().toUpperCase();
  if (!symbol) return false;

  pending = { ...request, symbol };
  flushAttempts = 0;
  flushSidebarLoadQueue();
  return true;
}

export function flushSidebarLoadQueue(): void {
  if (!pending) return;

  const load = sidebarController.loadSymbol;
  const open = sidebarController.open;
  if (!load || !open) {
    if (flushAttempts >= MAX_FLUSH_ATTEMPTS) {
      console.error("[investor-overlay] sidebar bridge not ready");
      return;
    }
    flushAttempts += 1;
    clearFlushTimer();
    flushTimer = setTimeout(flushSidebarLoadQueue, 50);
    return;
  }

  clearFlushTimer();
  const next = pending;
  pending = null;
  load(next.symbol, next.market, "manual", next.tab);
  open();
}

export function markSidebarBridgeReady(): void {
  flushSidebarLoadQueue();
}

export async function consumePendingSidebarLoadFromSession(): Promise<void> {
  try {
    const result = await chrome.storage.session.get("pendingSidebarLoad");
    const pendingLoad = result.pendingSidebarLoad as
      | (SidebarLoadRequest & { ts?: number })
      | undefined;
    if (!pendingLoad?.symbol) return;
    if (pendingLoad.ts && Date.now() - pendingLoad.ts > 15000) {
      await chrome.storage.session.remove("pendingSidebarLoad");
      return;
    }
    await chrome.storage.session.remove("pendingSidebarLoad");
    requestSidebarLoad(pendingLoad);
  } catch {
    /* session storage unavailable in this context */
  }
}
