import type { Market } from "../types";

export interface ScreenerMetrics {
  roce: string | null;
  promoterHolding: string | null;
  roe: string | null;
  marketCap: string | null;
  pe: string | null;
  debtEquity: string | null;
}

/** Extract the value from a #top-ratios <li> whose text contains `keyword`. */
function topRatioValue(html: string, keyword: string): string | null {
  // Isolate the top-ratios <ul> block
  const ulStart = html.indexOf('id="top-ratios"');
  if (ulStart === -1) return null;
  const ulEnd = html.indexOf("</ul>", ulStart);
  const section = ulStart !== -1 && ulEnd !== -1 ? html.slice(ulStart, ulEnd) : html;

  // Split into <li> chunks
  const items = section.split(/<li[\s>]/i);
  for (const item of items) {
    if (!item.toLowerCase().includes(keyword.toLowerCase())) continue;
    // Extract the .number span value
    const m = item.match(/class="number"[^>]*>([\s\S]*?)<\/span>/);
    if (m) {
      return m[1].replace(/<[^>]+>/g, "").trim() || null;
    }
  }
  return null;
}

/** Extract promoter holding from the shareholding table. */
function parsePromoterHolding(html: string): string | null {
  // Screener.in renders shareholding as a table; look for a <td>Promoters</td> row
  const promoIdx = html.search(/>[Pp]romoters?<\//);
  if (promoIdx === -1) return null;
  const nearby = html.slice(promoIdx, promoIdx + 400);
  // Next <td> after the label contains the percentage
  const m = nearby.match(/<td[^>]*>([\d.,\s%]+)<\/td>/);
  return m ? m[1].trim() || null : null;
}

/** Extract D/E from the key-ratios or peer-comparison table. */
function parseDebtEquity(html: string): string | null {
  const idx = html.search(/[Dd]ebt\s*[/\-to]+\s*[Ee]quity/i);
  if (idx === -1) return null;
  const nearby = html.slice(idx, idx + 400);
  const m = nearby.match(/class="number"[^>]*>([\s\S]*?)<\/span>/);
  if (m) return m[1].replace(/<[^>]+>/g, "").trim() || null;
  // Fallback: look for a <td> value
  const td = nearby.match(/<td[^>]*>([\d.,\s%]+)<\/td>/);
  return td ? td[1].trim() || null : null;
}

export async function fetchScreenerMetrics(
  symbol: string,
  market: Market,
): Promise<ScreenerMetrics | null> {
  if (market !== "India-NSE" && market !== "India-BSE") return null;

  const base = symbol.toUpperCase().replace(/\.(NS|BO)$/, "");
  const url = `https://www.screener.in/company/${encodeURIComponent(base)}/`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    return {
      roce: topRatioValue(html, "ROCE"),
      roe: topRatioValue(html, "ROE"),
      marketCap: topRatioValue(html, "Market Cap"),
      pe: topRatioValue(html, "Stock P/E") ?? topRatioValue(html, "P/E"),
      debtEquity: parseDebtEquity(html),
      promoterHolding: parsePromoterHolding(html),
    };
  } catch {
    return null;
  }
}
