# Nasdaq Halt Monitor Settings Guide

This guide explains what each popup setting does and when to adjust it.

## Enable Monitoring

Turns scheduled checks on or off.

Use it when you want background halt monitoring while the browser is open. When enabled, the extension keeps one inactive Nasdaq halt page as its monitor tab. Turn it off when you only want to use **Check now** manually.

## Check Every

Controls the live monitor polling interval in seconds.

Use a shorter interval, such as `10` or `15`, when you actively watch fast-moving names and want quicker notification. Use a longer interval to reduce background activity and requests to the Nasdaq page.

## Alert All Symbols

When enabled, the extension alerts for any current halt matching the selected reason codes.

Use this for broad market awareness. Turn it off when you only care about a specific symbol list.

## Watchlist Symbols

Symbols entered here are used only when **Alert all symbols** is off.

Enter symbols separated by commas, spaces, semicolons, or new lines. For example:

```text
AAPL, TSLA
NVDA; AMD
```

Use a watchlist when broad halt alerts would be noisy or when you are monitoring a specific trading universe.

## Reason Codes

Controls which Nasdaq halt reason codes trigger alerts.

The popup includes a **Code meanings** link to the official [Nasdaq Trader Trading Halt Codes](https://nasdaqtrader.com/trader.aspx?id=tradehaltcodes) page.

- `LUDP`: Limit Up-Limit Down pause.
- `LUDS`: Limit Up-Limit Down straddle condition.
- `T1`: News pending.
- `T2`: News released.

Use `LUDP` and `LUDS` for volatility-related pause awareness. Use `T1` and `T2` when you care about news-driven halts.

## Only Open Halts

When enabled, the extension ignores halt rows that already show a completed Nasdaq **Resumption Trade Time**.

Keep this on for active halt alerts. Turn it off only if you want to see recent matching halt rows even after trading has resumed. Nasdaq may populate a resumption date or quote time before the trade time; those rows are still treated as open until the trade time appears.

## Check Now

Runs one immediate source-page check with the current saved settings.

Use this after loading the extension, changing settings, or checking whether Nasdaq Trader is reachable.

## Test Alert

Sends a test Windows desktop notification and places an `OK` badge on the extension icon.

Use this after loading or reloading the extension to confirm Edge and Windows notification permissions are allowing alerts. The status line shows the browser notification permission and the notification ID that Edge returned. If the popup reports an alert error, reload the extension from `edge://extensions` after updating the files.

If the popup says `Permission: granted` but no Windows banner appears, the extension has successfully asked Edge to create the notification and Windows is likely suppressing the visible toast. Check **Windows Settings > System > Notifications > Microsoft Edge**, enable **Show notification banners**, and make sure Focus Assist / Do Not Disturb is off. Also check Windows notification center, where silent or suppressed alerts may still appear.

## Open Nasdaq

Opens the Nasdaq Trader Current Trade Halts page in a visible tab.

Use this when you want to verify the source data directly.

## Reset Memory

Clears local alert memory.

Use this if you want the extension to alert again for halt rows it has already notified you about. It does not clear your settings or watchlist.
