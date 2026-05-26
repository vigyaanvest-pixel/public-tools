# Privacy Notice — VigyaanVest.com Investor Tools

This notice applies to all browser extensions and tools published in the VigyaanVest.com Investor Tools collection, including Market Squawk, Nasdaq Halt Monitor, and Symbol 360.

---

## How These Tools Handle Your Data

Every tool in this collection is designed with a single principle: **your data stays on your device**.

### What the tools do

- Read visible page content on the specific supported sites they are active on (e.g., TradingView, Finviz, MarketWatch, Zerodha Pulse for Market Squawk; the Nasdaq Trader halts page for Nasdaq Halt Monitor; supported finance pages for Symbol 360 page enrichment).
- Store your settings locally in browser storage (e.g., voice preferences, alert codes, watchlist symbols, read-memory keys, enabled state).
- Use browser-native APIs — text-to-speech, browser notifications, local storage — to deliver their features.

### What the tools do not do

- Send saved notes, watchlists, halt data, or browsing history to VigyaanVest.com.
- Send saved notes or watchlists to third-party finance sources. Symbol lookups may place the requested ticker in a public finance-source URL.
- Collect analytics or usage telemetry.
- Sell, share, or transmit browsing data.
- Require an account, login, or email address.
- Set cookies or use tracking pixels.

---

## Storage

Each tool stores its settings in **browser local storage** on your device. This data does not leave your browser. You can clear it at any time by clearing the extension's storage or uninstalling the extension.

---

## Network Requests

- **Market Squawk** makes no outbound network requests of its own. It reads pages you navigate to in your browser through the normal content-script mechanism.
- **Nasdaq Halt Monitor** opens the public Nasdaq Trader Trade Halts page (`nasdaqtrader.com`) in a background tab to read the halt table. It connects only to that public page — no data is sent to VigyaanVest.com.
- **Symbol 360** may fetch market data and earnings data directly from third-party finance sources such as Yahoo Finance, Finviz, Screener.in, NSE India, TradingView chart widgets, and SEC pages depending on the symbol and tab. Notes, watchlists, settings, and review dates stay in browser local storage. No data is sent to VigyaanVest.com.

---

## Forks and Modifications

If a fork or modified version of any tool adds network services, telemetry, account features, or non-local data handling, its maintainers must update the privacy notice before redistribution.

---

## Tool-Specific Notes

Each tool's folder contains a short tool-specific privacy note:

- [Market Squawk Privacy](market-squawk/PRIVACY.md)
- [Nasdaq Halt Monitor Privacy](nasdaq-halt-monitor/PRIVACY.md)
- [Symbol 360 Privacy](investor-overlay/PRIVACY.md)

---

## Contact

Questions about privacy in these tools can be directed to VigyaanVest.com via the contact page at [vigyaanvest.com](https://vigyaanvest.com).
