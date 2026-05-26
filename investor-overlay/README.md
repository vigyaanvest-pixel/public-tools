# Symbol 360

Symbol 360 is an unpacked Microsoft Edge / Chrome extension, powered by [VigyaanVest.com](https://vigyaanvest.com), that gives investors a local-first research sidebar for any stock symbol.

It is designed for repeatable symbol review: snapshot, valuation, quality, chart, events, thesis notes, watchlist, and dashboard views live in the browser side panel. Notes, watchlists, review dates, and settings stay in local browser storage.

## About VigyaanVest.com

[VigyaanVest.com](https://vigyaanvest.com) builds professional stock market signals and investment education for serious traders. Symbol 360 includes a lightweight VigyaanVest performance summary with links to the public performance dashboard so users can verify signal history before joining.

## Download and Install

No technical tools or coding knowledge needed. Follow these three steps.

### Step 1 - Download the code to your computer

1. Go to **[investortools.vigyaanvest.com](https://investortools.vigyaanvest.com)** and click **View on GitHub** next to Symbol 360 - or go directly to [github.com/vigyaanvest-pixel/investortools](https://github.com/vigyaanvest-pixel/investortools).
2. On the GitHub page, click the green **Code** button.
3. Click **Download ZIP** from the menu that appears.
4. Save the ZIP file somewhere easy to find, such as your **Desktop** or **Downloads** folder.
5. Find the downloaded file, named something like `investortools-main.zip`. **Right-click** it and choose **Extract All...**
6. Click **Extract**. Windows creates a new folder called `investortools-main`. Open that folder and keep it open for Step 3.

> **Important:** After installing, do not delete or move this folder. Edge loads the extension directly from it every time you open the browser.

### Step 2 - Turn on Developer mode in Edge

Symbol 360 is not in the Edge Add-ons store. It runs from the folder on your computer, so Edge requires **Developer mode** to be switched on. You only need to do this once.

1. Open **Microsoft Edge**.
2. Click in the address bar at the top, type `edge://extensions`, and press **Enter**.
3. Look for the **Developer mode** toggle in the top-right corner of the page and switch it **on**.
   - Edge may show a pop-up warning about developer extensions. Click **OK** to continue.

### Step 3 - Load Symbol 360 into Edge

1. Click **Load unpacked**.
2. In the file browser that opens, navigate to the `investortools-main` folder you extracted in Step 1.
3. Open the **`investor-overlay`** folder.
4. Select the **`dist`** folder inside it.
5. Click **Select Folder**.
6. Symbol 360 now appears in your Extensions list and in the Edge toolbar. Installation is complete.

Retail users do not need to run a build. Do not load the `investor-overlay` source folder directly; load `investor-overlay/dist`.

## Features

- Symbol-scoped side panel that works on any page.
- Quick symbol switcher with US, India NSE, and India BSE market options.
- Research tabs: Snapshot, Valuation, Quality, Chart, Events, Thesis, Watchlist, and Dashboard.
- Market data fallback across Yahoo Finance chart data, Finviz for US symbols, and Screener.in for India metrics.
- Earnings and event review flow with earnings fallback, review date picker, event notes, and follow-up notes.
- Local watchlist, thesis notes, tags, status, and review-date dashboard.
- TradingView daily chart embed enabled by default in the Chart tab.
- VigyaanVest branding and public performance dashboard links in the Snapshot tab.
- Export/import JSON backup for local notes, watchlist, settings, and earnings cache.

## Supported Sources

| Source | Used for |
| --- | --- |
| Yahoo Finance | Quote chart data and best-effort earnings lookup |
| Finviz | US market data and earnings fallback |
| Screener.in | India valuation and quality metrics |
| NSE India | India quick links and symbol context |
| BSE India | India quick links |
| SEC EDGAR | US filings quick link |
| TradingView | Optional chart embed and chart links |

Fields that cannot be fetched or extracted show a dash instead of failing the panel.

## Settings

Open Extension options from the browser extensions page. See [SETTINGS.md](SETTINGS.md) for the full settings guide.

## Development

```bash
npm install
npm run dev
npm run test
npx tsc --noEmit
npm run build
```

Developers can rebuild `dist` after source changes. Reload the unpacked extension after a build.

## Privacy

Symbol 360 stores notes, watchlists, settings, recent symbols, review dates, and cached earnings data in browser storage on your device. It does not send data to VigyaanVest.com.

Some tabs may fetch public third-party finance pages or APIs directly from the extension. See [PRIVACY.md](PRIVACY.md) and the repo-wide [Privacy Notice](../PRIVACY.md).

## Legal

Symbol 360 is a research organization tool only. It does not provide investment advice, trade recommendations, portfolio management, or execution services. See the repo-wide [Legal Notice](../LEGAL.md).

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
