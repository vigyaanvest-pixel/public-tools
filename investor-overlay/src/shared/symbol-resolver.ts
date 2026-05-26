import type { ExtensionMessage, Market, TabId } from "./types";

export function sendMessage<T = unknown>(
  message: ExtensionMessage,
): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

export async function sendTabMessage<T = unknown>(
  tabId: number,
  message: ExtensionMessage,
): Promise<T | undefined> {
  try {
    return (await chrome.tabs.sendMessage(tabId, message)) as T;
  } catch {
    return undefined;
  }
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

export async function getActiveTabId(): Promise<number | undefined> {
  return (await getActiveTab())?.id;
}

function isRestrictedTabUrl(url?: string): string | null {
  if (!url) return "No page URL — open a website tab first.";
  const blocked = [
    "chrome://",
    "edge://",
    "about:",
    "chrome-extension://",
    "extension://",
    "devtools://",
    "view-source:",
  ];
  for (const prefix of blocked) {
    if (url.startsWith(prefix)) {
      return "Open a regular stock/news website tab first (browser system pages are not supported).";
    }
  }
  return null;
}

export async function deliverLoadToActiveTab(payload: {
  symbol: string;
  market: Market;
  tab?: TabId;
}): Promise<{ ok: boolean; error?: string }> {
  const symbol = payload.symbol.trim().toUpperCase();
  if (!symbol) {
    return { ok: false, error: "Enter a symbol first." };
  }

  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }

  const restricted = isRestrictedTabUrl(tab.url);
  if (restricted) {
    return { ok: false, error: restricted };
  }

  try {
    await chrome.storage.session.set({
      pendingSidebarLoad: { ...payload, symbol, ts: Date.now() },
    });
  } catch {
    /* popup/session may be unavailable — tab message still attempted */
  }

  const response = await sendTabMessage<{ ok?: boolean }>(tab.id, {
    type: "LOAD_SYMBOL",
    payload: { symbol, market: payload.market, tab: payload.tab },
  });

  if (response?.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    error:
      "Could not open sidebar on this tab. Refresh the page once, then click Load again.",
  };
}

export interface ResolvedSymbol {
  symbol: string;
  market: Market;
  source: import("./types").SymbolSource;
  companyName?: string;
}

export function resolveSymbolPriority(input: {
  manualSymbol?: string | null;
  manualMarket?: Market | null;
  watchlistClick?: { symbol: string; market: Market } | null;
  session?: { symbol: string; market: Market } | null;
  pageContext?: import("./types").DetectedPageContext | null;
}): ResolvedSymbol | null {
  if (input.manualSymbol?.trim()) {
    return {
      symbol: input.manualSymbol.trim().toUpperCase(),
      market: input.manualMarket ?? "US",
      source: "manual",
    };
  }
  if (input.watchlistClick) {
    return { ...input.watchlistClick, source: "watchlist" };
  }
  if (input.session) {
    return { ...input.session, source: "session" };
  }
  if (input.pageContext?.symbol) {
    return {
      symbol: input.pageContext.symbol,
      market: input.pageContext.market ?? "US",
      source: "page-detected",
      companyName: input.pageContext.companyName ?? undefined,
    };
  }
  return null;
}

export function yahooSymbolForMarket(symbol: string, market: Market): string {
  const base = symbol.toUpperCase();
  if (market === "India-NSE" && !base.endsWith(".NS")) return `${base}.NS`;
  if (market === "India-BSE" && !base.endsWith(".BO")) return `${base}.BO`;
  return base;
}

export function tradingViewSymbol(symbol: string, market: Market): string {
  const base = symbol.toUpperCase();
  switch (market) {
    case "India-NSE":
      return `NSE:${base.replace(/\.NS$/, "")}`;
    case "India-BSE":
      return `BSE:${base.replace(/\.BO$/, "")}`;
    case "UK":
      return `LSE:${base}`;
    default:
      return `NASDAQ:${base}`;
  }
}
