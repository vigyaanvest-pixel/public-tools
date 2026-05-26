import type { ExtractedMetrics, Market } from "../types";
import { yahooSymbolForMarket } from "../symbol-resolver";

const YAHOO_HOSTS = [
  "https://query2.finance.yahoo.com",
  "https://query1.finance.yahoo.com",
];

function fmtMarketCap(raw: number | null | undefined): string | null {
  if (raw == null) return null;
  if (raw >= 1e12) return `${(raw / 1e12).toFixed(2)}T`;
  if (raw >= 1e9) return `${(raw / 1e9).toFixed(2)}B`;
  if (raw >= 1e6) return `${(raw / 1e6).toFixed(2)}M`;
  return raw.toFixed(0);
}

function pickFmt(
  obj: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!obj) return null;
  const field = obj[key] as { fmt?: string; raw?: number } | undefined;
  return field?.fmt ?? null;
}

function pickRaw(
  obj: Record<string, unknown> | null | undefined,
  key: string,
): number | null {
  if (!obj) return null;
  const field = obj[key] as { fmt?: string; raw?: number } | undefined;
  return field?.raw ?? null;
}

function fmtNumber(raw: number | null | undefined): string | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  return raw.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function fmtPercent(raw: number | null | undefined): string | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  return `${raw >= 0 ? "+" : ""}${raw.toFixed(2)}%`;
}

export interface YahooMetricsResult {
  metrics: ExtractedMetrics;
  companyName: string | null;
}

async function fetchYahooChartMetrics(
  symbol: string,
  market: Market,
): Promise<YahooMetricsResult | null> {
  const ySym = yahooSymbolForMarket(symbol, market);
  const path = `/v8/finance/chart/${encodeURIComponent(ySym)}?range=1d&interval=1d`;

  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      const meta = json?.chart?.result?.[0]?.meta as Record<string, unknown> | undefined;
      if (!meta) continue;

      const low52 = typeof meta.fiftyTwoWeekLow === "number"
        ? fmtNumber(meta.fiftyTwoWeekLow)
        : null;
      const high52 = typeof meta.fiftyTwoWeekHigh === "number"
        ? fmtNumber(meta.fiftyTwoWeekHigh)
        : null;
      const currentPrice = typeof meta.regularMarketPrice === "number"
        ? meta.regularMarketPrice
        : null;
      const previousClose = typeof meta.chartPreviousClose === "number"
        ? meta.chartPreviousClose
        : null;
      const changePercent = currentPrice != null && previousClose
        ? ((currentPrice - previousClose) / previousClose) * 100
        : null;

      return {
        companyName:
          (meta.longName as string | undefined) ??
          (meta.shortName as string | undefined) ??
          null,
        metrics: {
          price: fmtNumber(currentPrice),
          changePercent: fmtPercent(changePercent),
          marketCap: null,
          pe: null,
          dividendYield: null,
          week52Range: low52 && high52 ? `${low52} - ${high52}` : null,
          roe: null,
          roce: null,
          debtEquity: null,
          promoterHolding: null,
          earningsDate: null,
          dividendDate: null,
          filingDate: null,
          source: "yahoo-chart",
        },
      };
    } catch {
      // try next host
    }
  }

  return null;
}

export async function fetchYahooMetrics(
  symbol: string,
  market: Market,
): Promise<YahooMetricsResult | null> {
  const ySym = yahooSymbolForMarket(symbol, market);
  const modules = "price,summaryDetail,financialData,defaultKeyStatistics";
  const path = `/v10/finance/quoteSummary/${encodeURIComponent(ySym)}?modules=${modules}&formatted=true`;

  // Try query2 first, fall back to query1 on any failure
  let result: Record<string, unknown> | null = null;
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      const r = json?.quoteSummary?.result?.[0];
      if (r) {
        result = r as Record<string, unknown>;
        break;
      }
    } catch {
      // try next host
    }
  }
  if (!result) return fetchYahooChartMetrics(symbol, market);

  const price = result.price as Record<string, unknown> | null;
  const summary = result.summaryDetail as Record<string, unknown> | null;
  const financial = result.financialData as Record<string, unknown> | null;
  const keyStats = result.defaultKeyStatistics as Record<string, unknown> | null;

  const low52 = pickFmt(summary, "fiftyTwoWeekLow");
  const high52 = pickFmt(summary, "fiftyTwoWeekHigh");

  const companyName =
    (price?.longName as string | undefined) ??
    (price?.shortName as string | undefined) ??
    null;

  const metrics: ExtractedMetrics = {
    price: pickFmt(price, "regularMarketPrice"),
    changePercent: pickFmt(price, "regularMarketChangePercent"),
    marketCap: fmtMarketCap(pickRaw(price, "marketCap")),
    pe: pickFmt(summary, "trailingPE"),
    dividendYield: pickFmt(summary, "dividendYield"),
    week52Range: low52 && high52 ? `${low52} – ${high52}` : null,
    roe: pickFmt(financial, "returnOnEquity") ?? pickFmt(keyStats, "returnOnEquity"),
    roce: null,              // not available from Yahoo — filled by screener.ts for India
    debtEquity: pickFmt(financial, "debtToEquity"),
    promoterHolding: null,   // India-specific — filled by screener.ts
    earningsDate: null,
    dividendDate: pickFmt(summary, "exDividendDate"),
    filingDate: null,
    source: "yahoo-api",
  };

  return { metrics, companyName };
}
