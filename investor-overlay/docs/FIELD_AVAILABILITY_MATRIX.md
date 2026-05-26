# Field Availability Matrix

Classifications: ✅ Available · ⚡ Conditional · ⚠ Unreliable · ❌ Not Available · 🔲 PENDING

Manual sign-off required before marking Available. See spec §35.

## Detection

| Field | Yahoo Finance | NSE India | Screener.in | SEC EDGAR |
|-------|---------------|-----------|-------------|-----------|
| Ticker from URL | ✅ | ✅ | ✅ | ⚡ CIK/ticker param |

## Snapshot

| Field | Yahoo | NSE | Screener | SEC |
|-------|-------|-----|----------|-----|
| Price | ⚡ | ⚡ | ⚡ | ❌ |
| Market cap | ⚡ | ❌ | ⚡ | ❌ |
| 52-week range | ⚡ | ⚡ | ❌ | ❌ |

## Valuation

| Field | Yahoo | NSE | Screener | SEC |
|-------|-------|-----|----------|-----|
| P/E | ⚡ | ❌ | ❌ | ❌ |
| Dividend yield | ⚡ | ❌ | ❌ | ❌ |

## Quality

| Field | Yahoo | NSE | Screener | SEC |
|-------|-------|-----|----------|-----|
| ROE | ❌ | ❌ | ⚡ | ❌ |
| ROCE | ❌ | ❌ | ⚡ | ❌ |

## Events

| Field | Yahoo | NSE | Screener | SEC |
|-------|-------|-----|----------|-----|
| Earnings date | ⚡ page + fetch | ⚡ fetch | ⚡ fetch | ❌ |
| Filing date | ❌ | ❌ | ❌ | ⚡ |

> MVP ships with best-effort extractors. Re-test after site DOM changes and update this matrix.
