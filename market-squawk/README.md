# Market Squawk

Market Squawk is an unpacked Microsoft Edge / Chrome extension, powered by [VigyaanVest.com](https://vigyaanvest.com), that watches supported investor news pages and reads newly detected top-of-page headlines aloud.

It started as a TradingView News Flow helper and has been generalized with domain-based source detection so the same extension can support Finviz and other investor research sources.

## Why Use It

Market Squawk covers the lightweight "read market headlines aloud while I work" workflow without requiring a separate paid squawk-style tool. As pricing context, PriceSquawk lists its Monthly Pro plan at `$49/month`, while Benzinga Pro lists Audio Squawk in its Streamlined plan at `$147/month`. For users who only need browser-based headline reading on supported public pages, Market Squawk can save roughly `$40+/month` versus entry-level paid audible-market tools.

Sources: [PriceSquawk pricing](https://pricesquawk.com/pricing/), [Benzinga Pro pricing](https://www.benzinga.com/pro/pricing/). Market Squawk is not a replacement for a professional live news desk or human squawk service.

## About VigyaanVest.com

[VigyaanVest.com](https://vigyaanvest.com) builds professional stock market signals and investment education for serious traders. The site focuses on AI-powered signal research, transparent tracking, and "verify before you join" workflows so users can review signal behavior before subscribing.

Market Squawk is one of the investor tools released around that philosophy: useful investor workflow software that can be inspected, loaded locally, and improved by the community.

## Supported Sources

- TradingView News Flow
- Finviz
- MarketWatch
- Zerodha Pulse

Source detection is automatic. The extension checks the active tab URL and applies the matching source profile from `src/sources.js`.

## Supported URL Patterns

The extension currently runs on these URL patterns:

| Source | Supported URLs |
| --- | --- |
| TradingView News Flow | `https://www.tradingview.com/news-flow/*` |
| Finviz | `https://finviz.com/news*`, `https://www.finviz.com/news*` |
| MarketWatch | `https://www.marketwatch.com/latest-news*`, `https://marketwatch.com/latest-news*` |
| Zerodha Pulse | `https://pulse.zerodha.com/*` |

Suggested starting pages:

| Source | Example URL |
| --- | --- |
| TradingView News Flow | `https://www.tradingview.com/news-flow/` |
| Finviz news | `https://finviz.com/news` |
| MarketWatch latest news | `https://www.marketwatch.com/latest-news?mod=home_ln` |
| Zerodha Pulse | `https://pulse.zerodha.com/` |

Host access is intentionally limited to the supported news pages above. If a source page is supported by URL but does not speak useful headlines, add or adjust that source's `selectors` and `titleSelectors` in `src/sources.js`.

## Download and Install

No technical tools or coding knowledge needed. Follow these four steps.

### Step 1 — Download the code to your computer

1. Go to **[investortools.vigyaanvest.com](https://investortools.vigyaanvest.com)** and click **View on GitHub** next to Market Squawk — or go directly to [github.com/vigyaanvest-pixel/investortools](https://github.com/vigyaanvest-pixel/investortools).
2. On the GitHub page, click the green **Code** button (top-right area of the file list).
3. Click **Download ZIP** from the menu that appears.
4. Save the ZIP file somewhere easy to find — your **Desktop** or **Downloads** folder works well.
5. Find the downloaded file (named something like `investortools-main.zip`). **Right-click** it and choose **Extract All...**
6. Click **Extract**. Windows creates a new folder called `investortools-main`. Open that folder — you will see a `market-squawk` folder inside it. Keep this window open for Step 3.

> **Important:** After installing, do not delete or move this folder. Edge loads the extension directly from it every time you open the browser.

### Step 2 — Turn on Developer mode in Edge

Market Squawk is not in the Edge Add-ons store — it runs from the folder on your computer. Edge requires **Developer mode** to be switched on for this to work. You only need to do this once.

1. Open **Microsoft Edge**.
2. Click in the address bar at the top, type `edge://extensions`, and press **Enter**.
3. Look for the **Developer mode** toggle in the top-right corner of the page and switch it **on**.
   - Edge may show a pop-up warning about developer extensions. Click **OK** to continue.

### Step 3 — Load the extension into Edge

1. Click **Load unpacked** — a button that appears after turning on Developer mode.
2. In the file browser that opens, navigate to the `investortools-main` folder you extracted in Step 1.
3. Open the **`market-squawk`** folder inside it (do not go any deeper — select that folder itself).
4. Click **Select Folder**.
5. Market Squawk now appears in your Extensions list and in the Edge toolbar. Installation is complete.

### Step 4 — Open a supported news page

Open any of these pages in Edge and Market Squawk will start listening automatically:

| Source | URL to open |
| --- | --- |
| TradingView News Flow | `https://www.tradingview.com/news-flow/` |
| Finviz news | `https://finviz.com/news` |
| MarketWatch latest news | `https://www.marketwatch.com/latest-news?mod=home_ln` |
| Zerodha Pulse | `https://pulse.zerodha.com/` |

The first time it loads a page, existing headlines are marked as already seen so it does not read the entire page at once. New headlines that appear after that are read aloud automatically.

## Use

- The extension starts enabled.
- Existing top headlines are marked as seen on page load to avoid reading an entire page repeatedly.
- When supported pages insert or reorder headlines, Market Squawk reads newly detected top items.
- If **Honor read memory** is off, reload reads the configured **Watch Top Items** count again whenever **Read watched top items on load** is on.
- Smart squawk wording is enabled by default. It expands common market shorthand like Q1, EPS, Rev, M&A, and ticker tails.
- Seen news IDs are remembered per source for a week.
- Auto refresh defaults to 60 minutes. Set **Auto Refresh Minutes** to `0` to disable it.
- Use the popup to pause, change voice/rate/volume, change how many top items are watched, read the current top headline, or stop speech.
- Use the **Sources** checklist in the popup to enable or disable individual sources without changing the extension manifest.
- Click **Open** next to any source in the popup to launch its supported news page.

For a setting-by-setting explanation, including when to adjust each control, see [Market Squawk Settings Guide](SETTINGS.md).

## Add A Source

Add a new source profile in `src/sources.js`:

```js
{
  id: "example",
  name: "Example Source",
  hostnames: ["example.com", "www.example.com"],
  pathPrefixes: ["/"],
  matchPatterns: ["https://example.com/*", "https://www.example.com/*"],
  startUrl: "https://example.com/news",
  selectors: ["article", "a[href*='/news/']"],
  titleSelectors: ["h2", "h3", "a[href*='/news/']"],
  noise: ["markets", "watchlist"],
  providerPattern: "\\b(Reuters|Example Wire)\\b\\s*[-:]?\\s*"
}
```

Then add the same `matchPatterns` to `manifest.json` under `content_scripts[0].matches` and `host_permissions`.

## Privacy

Market Squawk runs locally in your browser. It does not send browsing history, headlines, or settings to a server.

## Security, Responsibility, and Legal

Market Squawk is open source. Headline detection, read-memory, settings, and text-to-speech all run locally in your browser — nothing is sent to a server. Because it is distributed as an unpacked developer-mode extension, install it only if you are comfortable reviewing local browser extension code.

This extension is for news monitoring and accessibility-style audio reading only. It does not provide investment advice, trade recommendations, or portfolio guidance.

The full limitation of liability, no-warranties, and hold-harmless terms that apply to this tool are in the [VigyaanVest.com Investor Tools Legal Notice](../LEGAL.md).

## License

Market Squawk is released under the GNU General Public License v3.0. See `LICENSE` for the full terms.
