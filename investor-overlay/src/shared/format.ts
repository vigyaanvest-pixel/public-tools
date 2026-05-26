export function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }
  return value.trim();
}

export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 12);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function isStale(
  fetchedAt: string,
  ttlDays: number,
  warnAfterDays: number,
): { stale: boolean; warn: boolean; days: number } {
  const days = daysSince(fetchedAt);
  return {
    stale: days > ttlDays,
    warn: days > warnAfterDays,
    days,
  };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function storageKey(symbol: string, market?: string): string {
  const sym = normalizeSymbol(symbol);
  return market ? `${sym}::${market}` : sym;
}

export function parseStorageKey(key: string): { symbol: string; market?: string } {
  const [symbol, market] = key.split("::");
  return { symbol, market };
}
