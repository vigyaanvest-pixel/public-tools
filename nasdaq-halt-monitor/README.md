# Nasdaq Halt Monitor

Nasdaq Halt Monitor is an unpacked Microsoft Edge / Chrome extension, powered by [VigyaanVest.com](https://vigyaanvest.com), that checks the public Nasdaq Trader Trade Halts page and alerts when matching current halts are detected.

It is designed for investors who want a lightweight browser-only alert layer for halt events without publishing a watchlist, running a server, or wiring paid data feeds into a personal workflow.

## About VigyaanVest.com

[VigyaanVest.com](https://vigyaanvest.com) builds professional stock market signals and investment education for serious traders. The site focuses on AI-powered signal research, transparent tracking, and "verify before you join" workflows so users can review signal behavior before subscribing.

Nasdaq Halt Monitor is part of the VigyaanVest.com investor tools collection: inspectable, browser-first software for investors who want practical workflow helpers they can review before using.

## Supported Source

| Source | Supported URL |
| --- | --- |
| Nasdaq Trader Current Trade Halts | `https://www.nasdaqtrader.com/trader.aspx?id=TradeHalts` |

When monitoring is enabled, the extension keeps one inactive Nasdaq Trader tab alive, refreshes the halt table in that tab, and reads the current trade halt table from it. This approach is used because Nasdaq populates the halt table dynamically in the browser.

Opening the Nasdaq halt page manually in another tab is fine. The monitor is attached to its stored monitor tab, not every page you open. If the stored tab is closed, the extension creates or reuses one Nasdaq halt tab on the next monitor setup.

## Features

- Alerts on current Nasdaq halt rows matching selected reason codes.
- Optional watchlist filter for symbols you care about.
- Option to alert all symbols when you want broad halt awareness.
- Adjustable check interval.
- Live polling from one stored monitor tab so scheduled runs do not build a delayed alert queue.
- Open-halt filtering so rows with a completed resumption trade time can be ignored.
- Local alert memory to avoid repeating the same halt alert.
- One-click source-page open from the popup.
- Complete in-browser operation with no server, account, analytics, or external API key.

For a setting-by-setting explanation, see [Nasdaq Halt Monitor Settings Guide](SETTINGS.md).

## Download and Install

No technical tools or coding knowledge needed. Follow these four steps.

### Step 1 — Download the code to your computer

1. Go to **[investortools.vigyaanvest.com](https://investortools.vigyaanvest.com)** and click **View on GitHub** next to Nasdaq Halt Monitor — or go directly to [github.com/vigyaanvest-pixel/investortools](https://github.com/vigyaanvest-pixel/investortools).
2. On the GitHub page, click the green **Code** button (top-right area of the file list).
3. Click **Download ZIP** from the menu that appears.
4. Save the ZIP file somewhere easy to find — your **Desktop** or **Downloads** folder works well.
5. Find the downloaded file (named something like `investortools-main.zip`). **Right-click** it and choose **Extract All...**
6. Click **Extract**. Windows creates a new folder called `investortools-main`. Open that folder — you will see a `nasdaq-halt-monitor` folder inside it. Keep this window open for Step 3.

> **Important:** After installing, do not delete or move this folder. Edge loads the extension directly from it every time you open the browser.

### Step 2 — Turn on Developer mode in Edge

Nasdaq Halt Monitor is not in the Edge Add-ons store — it runs from the folder on your computer. Edge requires **Developer mode** to be switched on for this to work. You only need to do this once.

1. Open **Microsoft Edge**.
2. Click in the address bar at the top, type `edge://extensions`, and press **Enter**.
3. Look for the **Developer mode** toggle in the top-right corner of the page and switch it **on**.
   - Edge may show a pop-up warning about developer extensions. Click **OK** to continue.

### Step 3 — Load the extension into Edge

1. Click **Load unpacked** — a button that appears after turning on Developer mode.
2. In the file browser that opens, navigate to the `investortools-main` folder you extracted in Step 1.
3. Open the **`nasdaq-halt-monitor`** folder inside it (do not go any deeper — select that folder itself).
4. Click **Select Folder**.
5. Nasdaq Halt Monitor now appears in your Extensions list and in the Edge toolbar. Installation is complete.

### Step 4 — Set up your alerts

Before monitoring starts, tell the extension what to watch for:

1. Click the **Nasdaq Halt Monitor** icon in the Edge toolbar to open the popup.
2. Choose your **Reason Codes** — these control which halt types trigger an alert. Good starting defaults are **LUDP** (Limit Up-Limit Down pause) and **T1** (News pending). You can add more later.
3. Optionally enter **ticker symbols** in the Watchlist field if you only want alerts for specific stocks. Leave it blank to get alerts for all halts.
4. Click **Save**.
5. Click **Check now** to confirm the extension can reach the Nasdaq Trader page successfully.
6. Click **Test alert** to confirm Windows notifications are appearing on your screen.

## Test Windows Notifications

After loading the extension, open the popup and click **Test alert**.

If the popup says `Permission: granted` but no Windows notification appears:

1. Open Windows notification center and check whether the alert is listed there.
2. Open **Windows Settings > System > Notifications > Microsoft Edge**.
3. Confirm notifications are on and **Show notification banners** is enabled.
4. Check that Focus Assist / Do Not Disturb is not hiding banners.
5. Go back to `edge://extensions` and click the reload icon for Nasdaq Halt Monitor after changing extension files.

The extension also places a small badge on the extension icon when alerts fire, so users still get a browser-level signal if Windows suppresses the toast banner.

## Reason Codes

The default alert codes are below. For the full official reference, see [Nasdaq Trader Trading Halt Codes](https://nasdaqtrader.com/trader.aspx?id=tradehaltcodes).

| Code | Common Use |
| --- | --- |
| `LUDP` | Limit Up-Limit Down pause |
| `LUDS` | Limit Up-Limit Down straddle condition |
| `T1` | News pending |
| `T2` | News released |

Nasdaq can add or change published halt reason details. Treat the extension as a monitoring helper and confirm material halt information directly on the Nasdaq Trader page or other official sources before acting. The **Only open halts** filter treats a halt as open until the Nasdaq row has a populated **Resumption Trade Time**.

## Privacy

Nasdaq Halt Monitor runs locally in your browser. It stores settings, watchlist symbols, recent check status, and alert-memory keys in browser local storage. It does not send watchlists, halt data, browsing history, or settings to VigyaanVest.com or any third-party server.

## Security, Responsibility, and Legal

Nasdaq Halt Monitor is open source. Source-page opening, table parsing, settings, alert memory, and browser notifications all run locally in your browser — nothing is sent to a server. Because it is distributed as an unpacked developer-mode extension, install it only if you are comfortable reviewing local browser extension code.

This extension is for public market-data monitoring and convenience alerts only. It does not provide investment advice, trade recommendations, execution guidance, or portfolio guidance. Nasdaq source availability, table structure, and halt timing can change without notice — always confirm material halt information directly on the Nasdaq Trader page or other official sources before acting.

The full limitation of liability, no-warranties, and hold-harmless terms that apply to this tool are in the [VigyaanVest.com Investor Tools Legal Notice](../LEGAL.md).

## License

Nasdaq Halt Monitor is released under the GNU General Public License v3.0. See `LICENSE` for the full terms.
