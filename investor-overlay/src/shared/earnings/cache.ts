import type { EarningsCacheEntry, EarningsMemoryEntry, Market } from "../types";
import { nowIso, daysSince } from "../format";
import { yahooSymbolForMarket } from "../symbol-resolver";
import memoryData from "./earningsMemory.json";
import { getStorage, setStorage } from "../storage";

const memory = memoryData as Record<string, EarningsMemoryEntry>;

const NEGATIVE_CACHE_HOURS = 24;
const RATE_LIMIT_BACKOFF_MS = 5 * 60 * 1000;

let lastRateLimitedAt = 0;

export async function getCachedEarnings(
  symbol: string,
): Promise<EarningsCacheEntry | null> {
  const data = await getStorage();
  return data.earningsCache[symbol.toUpperCase()] ?? null;
}

export async function setCachedEarnings(
  entry: EarningsCacheEntry,
): Promise<void> {
  const data = await getStorage();
  data.earningsCache[entry.symbol.toUpperCase()] = entry;
  await setStorage({ earningsCache: data.earningsCache });
}

export function getOfflineMemoryEstimate(
  symbol: string,
  market: Market,
): { label: string; note: string } | null {
  const entry = memory[symbol.toUpperCase()];
  if (!entry || entry.market !== market) return null;
  const monthNames = entry.typicalMonths.map(
    (m) =>
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][m - 1],
  );
  return {
    label: `~${entry.typicalWeek} ${monthNames.join("/")}`,
    note: entry.note,
  };
}

function isNegativeCacheFresh(entry: EarningsCacheEntry): boolean {
  if (entry.nextEarningsDate !== null) return false;
  return daysSince(entry.fetchedAt) * 24 < NEGATIVE_CACHE_HOURS;
}

export async function fetchYahooEarnings(
  symbol: string,
  market: Market,
  ttlDays: number,
): Promise<EarningsCacheEntry | null> {
  if (Date.now() - lastRateLimitedAt < RATE_LIMIT_BACKOFF_MS) {
    return null;
  }

  const yahooSym = yahooSymbolForMarket(symbol, market);
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSym)}?modules=calendarEvents`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.status === 429) {
      lastRateLimitedAt = Date.now();
      return null;
    }
    if (!res.ok) {
      const miss: EarningsCacheEntry = {
        symbol: symbol.toUpperCase(),
        nextEarningsDate: null,
        earningsTime: null,
        fiscalQuarterEnding: null,
        epsEstimate: null,
        source: "yahoo-finance-miss",
        fetchedAt: nowIso(),
        ttlDays: 1,
      };
      await setCachedEarnings(miss);
      return miss;
    }
    const json = (await res.json()) as {
      quoteSummary?: {
        result?: Array<{
          calendarEvents?: {
            earnings?: {
              earningsDate?: Array<{ raw?: number; fmt?: string }>;
              earningsAverage?: { raw?: number; fmt?: string };
            };
          };
        }>;
      };
    };
    const earnings =
      json.quoteSummary?.result?.[0]?.calendarEvents?.earnings;
    const dateRaw = earnings?.earningsDate?.[0];
    const entry: EarningsCacheEntry = {
      symbol: symbol.toUpperCase(),
      nextEarningsDate: dateRaw?.fmt ?? null,
      earningsTime: null,
      fiscalQuarterEnding: null,
      epsEstimate: earnings?.earningsAverage?.fmt ?? null,
      source: "yahoo-finance",
      fetchedAt: nowIso(),
      ttlDays,
    };
    await setCachedEarnings(entry);
    return entry;
  } catch {
    return null;
  }
}

export async function resolveEarnings(
  symbol: string,
  market: Market,
  pageEarnings: string | null,
  settings: {
    enabled: boolean;
    ttlDays: number;
    stalenessWarningAfterDays: number;
    offlineMemoryEnabled: boolean;
  },
): Promise<{
  date: string | null;
  sourceLabel: string;
  stale: boolean;
}> {
  if (pageEarnings) {
    return { date: pageEarnings, sourceLabel: "from page", stale: false };
  }

  const cached = await getCachedEarnings(symbol);
  if (cached) {
    if (!cached.nextEarningsDate && isNegativeCacheFresh(cached)) {
      // Recent miss — skip network churn
    } else if (cached.nextEarningsDate) {
      const days = daysSince(cached.fetchedAt);
      const stale = days > settings.ttlDays;
      const warn = days > settings.stalenessWarningAfterDays;
      if (!stale || !settings.enabled) {
        return {
          date: cached.nextEarningsDate,
          sourceLabel: stale
            ? `cached · ${days} days ago ⚑`
            : `cached · ${days} days ago`,
          stale: warn,
        };
      }
    }
  }

  if (settings.enabled) {
    const fetched = await fetchYahooEarnings(symbol, market, settings.ttlDays);
    if (fetched?.nextEarningsDate) {
      return {
        date: fetched.nextEarningsDate,
        sourceLabel: "just fetched",
        stale: false,
      };
    }
    if (cached?.nextEarningsDate) {
      const days = daysSince(cached.fetchedAt);
      return {
        date: cached.nextEarningsDate,
        sourceLabel: `cached · ${days} days ago ⚑`,
        stale: true,
      };
    }
  }

  if (settings.offlineMemoryEnabled) {
    const mem = getOfflineMemoryEstimate(symbol, market);
    if (mem) {
      return { date: mem.label, sourceLabel: "estimated", stale: true };
    }
  }

  return { date: null, sourceLabel: "unavailable", stale: false };
}
