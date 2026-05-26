# Privacy - Symbol 360

Symbol 360 is local-first.

## Stored Locally

The extension stores the following in browser storage on your device:

- Watchlist symbols, status, tags, and review dates
- Thesis notes and event notes
- Company-name overrides
- Recent symbols and active tab state
- Settings such as theme, page extraction, TradingView embed, and earnings-cache preferences
- Cached earnings lookup results

## Network Requests

Symbol 360 does not send your data to VigyaanVest.com and does not use analytics or telemetry.

Depending on the symbol and tab, it may contact public third-party finance sources directly from your browser extension:

- Yahoo Finance for quote chart data and best-effort earnings lookup
- Finviz for US symbol market data and earnings fallback
- Screener.in for India valuation and quality metrics
- NSE India, BSE India, SEC EDGAR, and TradingView when you open related links or chart embeds

## Page Extraction

When enabled, page extraction reads visible DOM content from supported finance pages in the active browser tab to enrich the current symbol. It does not run a backend crawler.

## Clearing Data

Use the extension options page to export a JSON backup, clear earnings cache, clear session data, clear research data, or reset all local data.

See also the repo-wide [Privacy Notice](../PRIVACY.md).
