const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "..", "src", "sources.js");
const code = fs.readFileSync(sourcePath, "utf8");
const sandbox = { URL, globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox, { filename: sourcePath });

const { MarketSquawkSources } = sandbox;

function detects(url, id) {
  const source = MarketSquawkSources.detectSourceForUrl(url);
  assert.equal(source && source.id, id, url);
}

detects("https://www.tradingview.com/news-flow/vH8I2FxE", "tradingview");
detects("https://finviz.com/news", "finviz");
detects("https://www.finviz.com/news?v=2", "finviz");
detects("https://www.marketwatch.com/latest-news?mod=home_ln", "marketwatch");
detects("https://pulse.zerodha.com/", "zerodha-pulse");
detects("https://pulse.zerodha.com/?limit=10", "zerodha-pulse");

assert.equal(MarketSquawkSources.detectSourceForUrl("https://finviz.com/quote.ashx?t=NVDA&p=d"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://finance.yahoo.com/quote/AAPL/news"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.cnbc.com/markets/"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.benzinga.com/analyst-ratings"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.nasdaq.com/market-activity/stocks/aapl/news-headlines"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.reuters.com/markets/us/"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://seekingalpha.com/market-news/trending"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.investing.com/news/stock-market-news"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.moneycontrol.com/news/business/markets/"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://www.screener.in/company/RELIANCE/"), null);
assert.equal(MarketSquawkSources.detectSourceForUrl("https://example.com/news"), null);
assert.ok(MarketSquawkSources.getAllMatchPatterns().includes("https://finviz.com/news*"));
assert.ok(MarketSquawkSources.getAllMatchPatterns().includes("https://pulse.zerodha.com/*"));
MarketSquawkSources.SOURCE_PROFILES.forEach((source) => {
  assert.ok(source.startUrl, `${source.id} should define startUrl`);
  detects(source.startUrl, source.id);
});

console.log("source detection ok");
