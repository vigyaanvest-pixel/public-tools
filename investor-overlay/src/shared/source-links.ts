import type { Market } from "./types";

export interface QuickLink {
  label: string;
  url: string;
}

export function buildQuickLinks(symbol: string, market: Market): QuickLink[] {
  const sym = encodeURIComponent(symbol.toUpperCase());
  const base = symbol.toUpperCase().replace(/\.(NS|BO)$/, "");

  if (market === "India-NSE" || market === "India-BSE") {
    return [
      { label: "NSE India", url: `https://www.nseindia.com/get-quotes/equity?symbol=${base}` },
      { label: "BSE India", url: `https://www.bseindia.com/stock-share-price/${base.toLowerCase()}/` },
      { label: "Screener.in", url: `https://www.screener.in/company/${base}/` },
      { label: "Tickertape", url: `https://www.tickertape.in/stocks/${base.toLowerCase()}` },
      { label: "TradingView", url: `https://www.tradingview.com/chart/?symbol=NSE:${base}` },
      { label: "Moneycontrol", url: `https://www.moneycontrol.com/india/stockpricequote/${base.toLowerCase()}` },
    ];
  }

  return [
    { label: "Yahoo Finance", url: `https://finance.yahoo.com/quote/${sym}/` },
    { label: "Finviz", url: `https://finviz.com/quote.ashx?t=${sym}` },
    { label: "TradingView", url: `https://www.tradingview.com/chart/?symbol=${sym}` },
    { label: "SEC EDGAR", url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${sym}&owner=exclude&count=40` },
  ];
}

export function buildChartLinks(symbol: string, market: Market): QuickLink[] {
  const sym = symbol.toUpperCase().replace(/\.(NS|BO)$/, "");
  if (market === "India-NSE" || market === "India-BSE") {
    return [
      { label: "TradingView", url: `https://www.tradingview.com/chart/?symbol=NSE:${sym}` },
      { label: "NSE Chart", url: `https://www.nseindia.com/get-quotes/equity?symbol=${sym}` },
      { label: "Screener Chart", url: `https://www.screener.in/company/${sym}/` },
    ];
  }
  return [
    { label: "TradingView", url: `https://www.tradingview.com/chart/?symbol=${sym}` },
    { label: "Yahoo Chart", url: `https://finance.yahoo.com/quote/${sym}/chart` },
    { label: "Finviz Chart", url: `https://finviz.com/quote.ashx?t=${sym}` },
  ];
}
