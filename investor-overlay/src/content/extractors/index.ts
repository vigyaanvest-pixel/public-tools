import type { DetectedPageContext, ExtractedMetrics } from "../../shared/types";

function textOf(el: Element | null): string | null {
  if (!el) return null;
  const t = (el as HTMLElement).innerText?.trim() || el.textContent?.trim();
  return t || null;
}

function safeExtract(fn: () => string | null): string | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

/** Search summary table for a labeled value. Works even when class names change. */
function findTableValue(labelPattern: RegExp): string | null {
  const cells = document.querySelectorAll("td");
  for (const cell of cells) {
    const label = (cell as HTMLElement).innerText?.trim() ?? cell.textContent?.trim() ?? "";
    if (labelPattern.test(label)) {
      const next = cell.nextElementSibling as HTMLElement | null;
      if (next) return (next.innerText?.trim() || next.textContent?.trim()) ?? null;
    }
  }
  return null;
}

export function extractYahoo(
  ctx: DetectedPageContext,
): Partial<ExtractedMetrics> {
  if (ctx.site !== "yahoo") return {};

  // Populate company name from h1 if missing ("Apple Inc. (AAPL)" → "Apple Inc.")
  if (!ctx.companyName) {
    const h1 = document.querySelector("h1");
    if (h1?.textContent) {
      ctx.companyName = h1.textContent.trim().replace(/\s*\([^)]+\)\s*$/, "").trim() || null;
    }
  }

  return {
    price: safeExtract(() =>
      textOf(
        document.querySelector('fin-streamer[data-field="regularMarketPrice"]') ??
        document.querySelector('[data-testid="qsp-price"]') ??
        document.querySelector('[data-field="regularMarketPrice"]'),
      ),
    ),
    changePercent: safeExtract(() =>
      textOf(document.querySelector('fin-streamer[data-field="regularMarketChangePercent"]')) ??
      textOf(document.querySelector('[data-field="regularMarketChangePercent"]')) ??
      textOf(document.querySelector('[data-testid="qsp-price-change-percent"]')),
    ),
    marketCap: safeExtract(() =>
      textOf(
        document.querySelector('fin-streamer[data-field="marketCap"]') ??
        document.querySelector('[data-field="marketCap"]'),
      ) ?? findTableValue(/^Market Cap/i),
    ),
    pe: safeExtract(() =>
      textOf(
        document.querySelector('fin-streamer[data-field="trailingPE"]') ??
        document.querySelector('[data-field="trailingPE"]'),
      ) ?? findTableValue(/^PE Ratio|^P\/E Ratio/i),
    ),
    dividendYield: safeExtract(() =>
      textOf(
        document.querySelector('fin-streamer[data-field="dividendYield"]') ??
        document.querySelector('fin-streamer[data-field="trailingAnnualDividendYield"]'),
      ) ?? findTableValue(/Forward Annual Dividend|Dividend.*Yield/i),
    ),
    week52Range: safeExtract(() => {
      const low = textOf(
        document.querySelector('fin-streamer[data-field="fiftyTwoWeekLow"]') ??
        document.querySelector('[data-field="fiftyTwoWeekLow"]'),
      );
      const high = textOf(
        document.querySelector('fin-streamer[data-field="fiftyTwoWeekHigh"]') ??
        document.querySelector('[data-field="fiftyTwoWeekHigh"]'),
      );
      if (low && high) return `${low} – ${high}`;
      return (
        textOf(document.querySelector('[data-testid="FIFTY_TWO_WK_RANGE-value"]')) ??
        findTableValue(/52.?[Ww]eek.?[Rr]ange/)
      );
    }),
    earningsDate: safeExtract(() =>
      textOf(document.querySelector('[data-testid="EARNINGS_DATE-value"]')) ??
      findTableValue(/^Earnings Date/i),
    ),
    roe: safeExtract(() =>
      findTableValue(/Return on Equity/i) ??
      findTableValue(/^ROE$/i),
    ),
    debtEquity: safeExtract(() =>
      findTableValue(/Total Debt\/Equity/i) ??
      findTableValue(/^Debt\/Equity/i),
    ),
    source: "Yahoo Finance",
  };
}

export function extractScreener(
  ctx: DetectedPageContext,
): Partial<ExtractedMetrics> {
  if (ctx.site !== "screener") return {};
  const companyName = safeExtract(() => textOf(document.querySelector("h1")));
  ctx.companyName = companyName;

  function topRatioValue(keyword: string): string | null {
    const items = document.querySelectorAll("#top-ratios li");
    for (const li of items) {
      if (li.textContent?.includes(keyword)) {
        return textOf(li.querySelector(".number"));
      }
    }
    return null;
  }

  return {
    price:   safeExtract(() => topRatioValue("Current Price") ?? textOf(document.querySelector("#top-ratios li:nth-child(1) span.number"))),
    changePercent: null,
    marketCap: safeExtract(() => topRatioValue("Market Cap")),
    roce:    safeExtract(() => topRatioValue("ROCE")),
    roe:     safeExtract(() => topRatioValue("ROE")),
    debtEquity: safeExtract(() =>
      findTableValue(/^Debt to equity$|^D\/E$|^Debt \/ Equity$/i) ??
      findTableValue(/Debt to equity/i),
    ),
    promoterHolding: safeExtract(() => {
      // Screener.in shows promoter holding in the shareholding section
      const cells = document.querySelectorAll("table td");
      for (const cell of cells) {
        const text = (cell as HTMLElement).innerText?.trim() ?? "";
        if (/^Promoters?$/i.test(text)) {
          const next = cell.nextElementSibling as HTMLElement | null;
          const val = next?.innerText?.trim() || next?.textContent?.trim();
          if (val && /\d/.test(val)) return val;
        }
      }
      return null;
    }),
    source: "Screener.in",
  };
}

export function extractNse(ctx: DetectedPageContext): Partial<ExtractedMetrics> {
  if (ctx.site !== "nse") return {};

  // Try to get company name from page title or h1
  if (!ctx.companyName) {
    const h1 = document.querySelector("h1");
    if (h1?.textContent) ctx.companyName = h1.textContent.trim() || null;
  }

  return {
    price: safeExtract(() =>
      textOf(
        document.querySelector("#lastPrice") ??
        document.querySelector(".last-price") ??
        document.querySelector('[id*="lastPrice"]') ??
        document.querySelector('[class*="lastPrice"]'),
      ),
    ),
    changePercent: null,
    week52Range: safeExtract(() => {
      const low = textOf(document.querySelector("#low52") ?? document.querySelector('[id*="52WeekLow"]'));
      const high = textOf(document.querySelector("#high52") ?? document.querySelector('[id*="52WeekHigh"]'));
      return low && high ? `${low} – ${high}` : null;
    }),
    source: "NSE India",
  };
}

export function extractSec(ctx: DetectedPageContext): Partial<ExtractedMetrics> {
  if (ctx.site !== "sec") return {};
  return {
    filingDate: safeExtract(() =>
      textOf(document.querySelector(".formGrouping .info") ?? document.querySelector("table tr td")),
    ),
    changePercent: null,
    source: "SEC EDGAR",
  };
}

export function extractMetrics(
  ctx: DetectedPageContext,
): ExtractedMetrics | null {
  if (ctx.site === "none" || !ctx.symbol) return null;
  const partial = {
    ...extractYahoo(ctx),
    ...extractScreener(ctx),
    ...extractNse(ctx),
    ...extractSec(ctx),
  };
  return {
    price: partial.price ?? null,
    changePercent: partial.changePercent ?? null,
    marketCap: partial.marketCap ?? null,
    pe: partial.pe ?? null,
    dividendYield: partial.dividendYield ?? null,
    week52Range: partial.week52Range ?? null,
    roe: partial.roe ?? null,
    roce: partial.roce ?? null,
    debtEquity: partial.debtEquity ?? null,
    promoterHolding: partial.promoterHolding ?? null,
    earningsDate: partial.earningsDate ?? null,
    dividendDate: partial.dividendDate ?? null,
    filingDate: partial.filingDate ?? null,
    source: partial.source ?? ctx.site,
  };
}
