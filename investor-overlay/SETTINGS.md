# Settings Guide - Symbol 360

Open Extension options from `edge://extensions` or `chrome://extensions`, then choose Symbol 360 -> Details -> Extension options.

## Display

| Setting | Default | Description |
| --- | --- | --- |
| Theme | Dark | Controls the extension UI theme |
| Open sidebar automatically | Off | Opens the sidebar automatically on supported finance pages |
| Floating launch button | On | Shows the floating `S` button on supported finance pages |
| Page extraction | On | Reads visible metrics from supported pages when the loaded symbol matches |
| TradingView embed | On | Shows the daily TradingView chart in the Chart tab |

## Earnings Cache

| Setting | Default | Description |
| --- | --- | --- |
| Yahoo fetch | On | Attempts best-effort earnings lookup from Yahoo Finance |
| Cache TTL | 7 days | How long fetched earnings dates are treated as fresh |
| Staleness warning | 5 days | Marks cached earnings dates as stale after this age |
| Offline memory | On | Shows known seasonal estimates when no live date is available |

If Yahoo earnings is unavailable, Symbol 360 may still show a US earnings fallback from Finviz through the market-data fetch.

## Backup

- Export JSON downloads watchlist, notes, settings, and earnings cache.
- Import (merge) adds or overwrites matching entries from a backup.
- Import (replace all) replaces local research data after confirmation.

## Clear Data

- Clear earnings cache removes cached earnings lookups only.
- Clear session resets recent symbols and sidebar UI state.
- Clear research data removes watchlist and notes.
- Clear all resets all local Symbol 360 data.

Export a backup before destructive clears if you want to preserve research notes.
