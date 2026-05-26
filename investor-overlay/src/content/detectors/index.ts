import type { DetectedPageContext, Market, SupportedSite } from "../../shared/types";

function detectMarketFromSymbol(symbol: string, site: SupportedSite): Market {
  if (site === "nse" || site === "screener") return "India-NSE";
  if (symbol.endsWith(".NS")) return "India-NSE";
  if (symbol.endsWith(".BO")) return "India-BSE";
  return "US";
}

export function detectYahoo(url: string): DetectedPageContext | null {
  if (!/finance\.yahoo\.com/.test(url)) return null;
  const match = url.match(/\/quote\/([^/?#]+)/i);
  const symbol = match?.[1]?.replace("%5E", "^") ?? null;
  const pageType = url.includes("/financials")
    ? "financials"
    : url.includes("/profile")
      ? "profile"
      : "quote";
  return {
    site: "yahoo",
    symbol: symbol?.toUpperCase() ?? null,
    companyName: null,
    market: symbol ? detectMarketFromSymbol(symbol, "yahoo") : null,
    pageType,
    url,
    title: typeof document !== "undefined" ? document.title : "",
  };
}

export function detectScreener(url: string): DetectedPageContext | null {
  if (!/screener\.in/.test(url)) return null;
  const match = url.match(/\/company\/([^/?#]+)/i);
  const symbol = match?.[1]?.toUpperCase() ?? null;
  return {
    site: "screener",
    symbol,
    companyName: null,
    market: "India-NSE",
    pageType: "company",
    url,
    title: typeof document !== "undefined" ? document.title : "",
  };
}

export function detectNse(url: string): DetectedPageContext | null {
  if (!/nseindia\.com/.test(url)) return null;
  let symbol: string | null = null;
  try {
    const u = new URL(url);
    symbol = u.searchParams.get("symbol")?.toUpperCase() ?? null;
  } catch {
    /* ignore */
  }
  if (!symbol) {
    const match = url.match(/symbol=([^&]+)/i);
    symbol = match?.[1]?.toUpperCase() ?? null;
  }
  return {
    site: "nse",
    symbol,
    companyName: null,
    market: "India-NSE",
    pageType: "quote",
    url,
    title: typeof document !== "undefined" ? document.title : "",
  };
}

export function detectSec(url: string): DetectedPageContext | null {
  if (!/sec\.gov/.test(url)) return null;
  let symbol: string | null = null;
  try {
    const u = new URL(url);
    symbol =
      u.searchParams.get("CIK")?.toUpperCase() ??
      u.searchParams.get("ticker")?.toUpperCase() ??
      null;
  } catch {
    /* ignore */
  }
  return {
    site: "sec",
    symbol,
    companyName: null,
    market: "US",
    pageType: "filings",
    url,
    title: typeof document !== "undefined" ? document.title : "",
  };
}

export function detectPageContext(url: string): DetectedPageContext {
  return (
    detectYahoo(url) ??
    detectScreener(url) ??
    detectNse(url) ??
    detectSec(url) ?? {
      site: "none",
      symbol: null,
      companyName: null,
      market: null,
      pageType: "unknown",
      url,
      title: typeof document !== "undefined" ? document.title : "",
    }
  );
}
