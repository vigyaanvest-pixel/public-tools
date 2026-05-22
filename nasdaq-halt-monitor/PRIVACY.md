# Privacy — Nasdaq Halt Monitor

Nasdaq Halt Monitor runs entirely in your browser. It checks the public Nasdaq Trader Trade Halts page on a schedule and fires browser notifications when matching halts are detected.

## What this tool does

- Opens the public Nasdaq Trader Current Trade Halts page (`nasdaqtrader.com`) in a background tab to read the halt table. No data is sent to VigyaanVest.com.
- Stores settings in browser local storage: enabled state, check interval, reason codes, watchlist symbols, last check status, and alert memory keys.
- Uses browser notifications (`chrome.notifications`) for halt alerts.

## What this tool does not do

- Send watchlists, halt data, or browsing history to VigyaanVest.com or any third party.
- Collect analytics or telemetry.
- Require an account or email address.

## Full Privacy Notice

For the complete privacy notice covering all tools in this collection, see [VigyaanVest.com Investor Tools Privacy Notice](../PRIVACY.md).
