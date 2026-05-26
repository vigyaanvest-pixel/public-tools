import type { ExtractedMetrics } from "../types";

export interface FinvizMetricsResult {
  metrics: ExtractedMetrics;
  companyName: string | null;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function cleanValue(value: string | null): string | null {
  if (!value) return null;
  const cleaned = decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  return cleaned && cleaned !== "-" ? cleaned : null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function snapshotValue(html: string, label: string): string | null {
  const pattern = new RegExp(
    `<div class="snapshot-td-label">${escapeRegExp(label)}<\\/div><\\/td><td[\\s\\S]*?<div class="snapshot-td-content"><b>([\\s\\S]*?)<\\/b>`,
    "i",
  );
  return cleanValue(html.match(pattern)?.[1] ?? null);
}

function firstNumber(value: string | null): string | null {
  return value?.match(/^-?[\d,.]+(?:\.\d+)?%?/)?.[0] ?? null;
}

function companyNameFromTitle(html: string, symbol: string): string | null {
  const title = cleanValue(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? null);
  if (!title) return null;
  return title
    .replace(new RegExp(`^${escapeRegExp(symbol)}\\s*-\\s*`, "i"), "")
    .replace(/\s+Stock Price and Quote.*$/i, "")
    .trim() || null;
}

export async function fetchFinvizMetrics(
  symbol: string,
): Promise<FinvizMetricsResult | null> {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
  if (!normalized) return null;

  try {
    const res = await fetch(`https://finviz.com/quote.ashx?t=${encodeURIComponent(normalized)}&p=d`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const low52 = firstNumber(snapshotValue(html, "52W Low"));
    const high52 = firstNumber(snapshotValue(html, "52W High"));

    return {
      companyName: companyNameFromTitle(html, normalized),
      metrics: {
        price: snapshotValue(html, "Price"),
        changePercent: snapshotValue(html, "Change"),
        marketCap: snapshotValue(html, "Market Cap"),
        pe: snapshotValue(html, "P/E"),
        dividendYield: null,
        week52Range: low52 && high52 ? `${low52} - ${high52}` : null,
        roe: snapshotValue(html, "ROE"),
        roce: null,
        debtEquity: snapshotValue(html, "Debt/Eq"),
        promoterHolding: null,
        earningsDate: snapshotValue(html, "Earnings"),
        dividendDate: null,
        filingDate: null,
        source: "finviz",
      },
    };
  } catch {
    return null;
  }
}
