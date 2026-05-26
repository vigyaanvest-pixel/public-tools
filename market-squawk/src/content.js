const DEFAULT_SETTINGS = {
  enabled: true,
  rate: 1,
  pitch: 1,
  volume: 0.9,
  voiceName: "",
  voiceKey: "",
  topWindow: 5,
  smartSpeech: true,
  refreshIntervalMinutes: 60,
  readTopOnLoad: true,
  honorReadMemory: true,
  enabledSources: {}
};

const currentSource = globalThis.MarketSquawkSources?.detectSourceForUrl(location.href) || {
  id: "generic",
  name: "Market source",
  selectors: ["article", "tr", "li", "[role='row']", "a"],
  titleSelectors: ["h1", "h2", "h3", "a"],
  noise: [],
  providerPattern: "\\b(Reuters|Dow Jones Newswires|MT Newswires|Benzinga|MarketWatch|CNBC)\\b\\s*[-:]?\\s*"
};

const SEEN_CACHE_KEY = `marketSquawkSeenNews:${currentSource.id}`;
const FORCE_READ_TOP_KEY = "marketSquawkForceReadTopOnLoad";

const state = {
  settings: { ...DEFAULT_SETTINGS },
  seen: new Map(),
  observer: null,
  refreshTimer: 0,
  persistTimer: 0,
  scanTimer: 0,
  initialized: false,
  lastTopSignature: "",
  hadSeenCache: false,
  forceReadTopOnLoad: false
};

const SELECTORS = currentSource.selectors || [];
const TITLE_SELECTORS = currentSource.titleSelectors || [];
const SKIP_SELECTORS = currentSource.skipSelectors || [];
const BLOCKED_HEADLINE_PATTERNS = (currentSource.blockedHeadlinePatterns || [])
  .map((pattern) => new RegExp(pattern, "i"));

const NOISE_LINES = new Set([
  "time",
  "instrument",
  "headline",
  "provider",
  "custom feed",
  "save",
  "reset all",
  "news flow",
  ...(currentSource.noise || [])
]);

function normalizeText(text) {
  const providerPattern = currentSource.providerPattern
    ? new RegExp(currentSource.providerPattern, "gi")
    : /\b(RTTNews|Reuters|Dow Jones Newswires|MT Newswires)\b\s*[-:]\s*/gi;

  return text
    .replace(/\s+/g, " ")
    .replace(providerPattern, "")
    .trim();
}

function cleanHeadline(text) {
  return normalizeText(text)
    .replace(/^\d{1,2}:\d{2}\s*(AM|PM)?\s*/i, "")
    .replace(/^\d+\s*(sec|min|h)\s+ago\s*/i, "")
    .replace(/\s+(Reuters|Dow Jones Newswires|MT Newswires|Benzinga|TheFly|TipRanks|MarketWatch)$/i, "")
    .trim();
}

function isLikelyChromeText(text) {
  return /^(Skip to main content|Products|Community|Markets|Brokers|More|Get started|Corporate activity|Economics|Country|Provider|Format)\b/i.test(text);
}

function getHeadlineFromNode(node) {
  const titleNode = findTitleNode(node);
  const raw = titleNode?.innerText || titleNode?.textContent || node.innerText || node.textContent || "";
  const text = normalizeText(raw);
  if (!text || text.length < 12) {
    return "";
  }

  const lines = raw
    .split(/\n+/)
    .map(normalizeText)
    .filter((line) => line && !NOISE_LINES.has(line.toLowerCase()));

  const bestLine = lines.find((line) => {
    if (line.length < 18) {
      return false;
    }

    return !/^(\d+\s*(min|sec|h)\b|\d{1,2}:\d{2}\s*(AM|PM)?\b|[A-Z]{1,6}([.,\s]|$))/i.test(line);
  });

  return cleanHeadline(bestLine || lines.join(" ") || text);
}

function findTitleNode(node) {
  for (const selector of TITLE_SELECTORS) {
    try {
      if (node.matches?.(selector)) {
        return node;
      }
      const found = node.querySelector?.(selector);
      if (found) {
        return found;
      }
    } catch (_error) {
      // Ignore source profile selector issues and continue with the next one.
    }
  }

  return node.matches?.("[class*='title' i]")
    ? node
    : node.querySelector?.("[class*='title' i]");
}

function getNewsItems() {
  const items = [];
  const seenKeys = new Set();
  const seenHeadlines = new Set();

  for (const selector of SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (shouldSkipNode(node)) {
        return;
      }

      const headline = getHeadlineFromNode(node);
      const canonicalHeadline = normalizeHeadlineKey(headline);
      const link = node.matches?.("a")
        ? node
        : node.querySelector?.("a[href]") || node.closest?.("a");
      const href = link?.href || "";
      const key = link?.dataset?.id || href || canonicalHeadline;

      if (
        !headline ||
        headline.length < 18 ||
        seenKeys.has(key) ||
        seenHeadlines.has(canonicalHeadline) ||
        isLikelyChromeText(headline) ||
        isBlockedHeadline(headline)
      ) {
        return;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.bottom < 0) {
        return;
      }

      seenKeys.add(key);
      seenHeadlines.add(canonicalHeadline);
      items.push({
        key: `${currentSource.id}:${key}`,
        headline,
        y: rect.top,
        x: rect.left
      });
    });
  }

  return sortNewsItemsByPosition(items)
    .filter((item) => item.headline.length <= 280);
}

function sortNewsItemsByPosition(items) {
  const rowTolerance = Number(currentSource.rowTolerancePx) || 12;
  const remaining = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const ordered = [];

  while (remaining.length) {
    const rowTop = remaining[0].y;
    const row = [];

    for (let index = 0; index < remaining.length;) {
      if (Math.abs(remaining[index].y - rowTop) <= rowTolerance) {
        row.push(...remaining.splice(index, 1));
      } else {
        index += 1;
      }
    }

    ordered.push(...row.sort((a, b) => a.x - b.x || a.y - b.y));
  }

  return ordered;
}

function normalizeHeadlineKey(headline) {
  return String(headline || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockedHeadline(headline) {
  return BLOCKED_HEADLINE_PATTERNS.some((pattern) => pattern.test(headline));
}

function shouldSkipNode(node) {
  return SKIP_SELECTORS.some((selector) => {
    try {
      return node.matches?.(selector) || node.querySelector?.(selector) || node.closest?.(selector);
    } catch (_error) {
      return false;
    }
  });
}

function remember(key) {
  state.seen.set(key, Date.now());

  if (state.seen.size > 400) {
    const newest = [...state.seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 250);
    state.seen = new Map(newest);
  }

  scheduleSeenPersist();
}

function speak(text, { force = false, format = true } = {}) {
  if (!state.settings.enabled && !force) {
    return;
  }

  const spokenText = state.settings.smartSpeech && format ? formatForSpeech(text) : text;
  chrome.runtime.sendMessage({ type: "SQUAWK_SPEAK", text: spokenText, force });
}

function speakBatch(items, { force = false } = {}) {
  if (!state.settings.enabled || !items.length) {
    return;
  }

  const texts = items.map((item) => state.settings.smartSpeech
    ? formatForSpeech(item.headline)
    : item.headline);
  chrome.runtime.sendMessage({ type: "SQUAWK_SPEAK_BATCH", texts, force });
}

function scan({ speakNew = true } = {}) {
  const items = getNewsItems();
  const topItems = items.slice(0, Number(state.settings.topWindow) || DEFAULT_SETTINGS.topWindow);
  const topSignature = topItems.map((item) => item.key).join("|");

  if (!state.initialized) {
    const freshOnLoad = state.hadSeenCache && state.settings.honorReadMemory
      ? topItems.filter((item) => !state.seen.has(item.key))
      : topItems;
    const shouldReadLoadedTop = state.settings.readTopOnLoad &&
      topItems[0] &&
      (!state.hadSeenCache || state.forceReadTopOnLoad);
    const shouldLeadWithTop = topItems[0] &&
      (shouldReadLoadedTop || (freshOnLoad.length && !freshOnLoad.some((item) => item.key === topItems[0].key)));
    const initialReadItems = shouldLeadWithTop
      ? [topItems[0], ...freshOnLoad.filter((item) => item.key !== topItems[0].key)]
      : freshOnLoad;

    topItems.forEach((item) => remember(item.key));
    state.initialized = true;
    state.lastTopSignature = topSignature;

    if (speakNew && initialReadItems.length) {
      speakBatch(initialReadItems);
      updateBadge(`${state.settings.smartSpeech ? "Smart read" : "Read"} ${initialReadItems.length}`);
      return;
    }

    updateBadge(`Ready (${items.length})`);
    return;
  }

  if (topSignature === state.lastTopSignature) {
    return;
  }

  const fresh = state.settings.honorReadMemory
    ? topItems.filter((item) => !state.seen.has(item.key))
    : topItems;
  const readBatch = fresh.length && topItems[0] && !fresh.some((item) => item.key === topItems[0].key)
    ? [topItems[0], ...fresh]
    : fresh;
  fresh.forEach((item) => remember(item.key));
  state.lastTopSignature = topSignature;

  if (speakNew && readBatch.length) {
    speakBatch(readBatch);
    readBatch.forEach((item) => remember(item.key));
    updateBadge(`${state.settings.smartSpeech ? "Smart read" : "Read"} ${readBatch.length}`);
  }
}

function scheduleScan() {
  window.clearTimeout(state.scanTimer);
  state.scanTimer = window.setTimeout(() => scan(), 300);
}

function updateBadge(text) {
  let badge = document.getElementById("market-squawk-status");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "market-squawk-status";
    document.documentElement.appendChild(badge);
  }

  badge.textContent = `${currentSource.name}: ${text}`;
  badge.classList.add("visible");
  window.clearTimeout(updateBadge.timer);
  updateBadge.timer = window.setTimeout(() => badge.classList.remove("visible"), 2200);
}

async function loadSettings() {
  const saved = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  state.settings = { ...DEFAULT_SETTINGS, ...saved };
}

async function init() {
  await loadSettings();
  if (!isCurrentSourceEnabled()) {
    updateBadge("Disabled for this source");
    return;
  }

  await loadSeenCache();
  scan({ speakNew: true });
  startAutoRefresh();

  state.observer = new MutationObserver(scheduleScan);
  state.observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") {
    return;
  }

  for (const [key, change] of Object.entries(changes)) {
    state.settings[key] = change.newValue;
  }

  if (Object.hasOwn(changes, "refreshIntervalMinutes")) {
    startAutoRefresh();
  }

  if (Object.hasOwn(changes, "enabledSources")) {
    window.location.reload();
    return;
  }

  updateBadge(state.settings.enabled ? "On" : "Off");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SQUAWK_STATUS") {
    const items = getNewsItems();
    const topWindow = Number(state.settings.topWindow) || DEFAULT_SETTINGS.topWindow;
    sendResponse({
      ready: state.initialized,
      headlineCount: items.length,
      sample: items[0]?.headline || "",
      headlines: items.slice(0, topWindow).map((item) => item.headline)
    });
    return true;
  }

  if (message?.type === "SQUAWK_READ_TOP") {
    const topItems = getNewsItems().slice(0, Number(state.settings.topWindow) || DEFAULT_SETTINGS.topWindow);
    if (topItems.length) {
      if (state.settings.honorReadMemory) {
        topItems.forEach((item) => remember(item.key));
      }
      speakBatch(topItems, { force: true });
      updateBadge(`${state.settings.smartSpeech ? "Smart read" : "Read"} ${topItems.length}`);
    }
    sendResponse({
      ok: Boolean(topItems.length),
      count: topItems.length,
      headline: topItems[0]?.headline || ""
    });
    return true;
  }

  if (message?.type === "SQUAWK_STOP") {
    updateBadge("Stopped");
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

function formatForSpeech(headline) {
  let text = headline.trim();
  const tickers = [...text.matchAll(/>([A-Z]{1,6})(?:\b|$)/g)].map((match) => match[1]);
  const leadTicker = tickers.find((ticker) => COMPANY_HINTS.has(ticker));

  text = text
    .replace(/^(Analyst note|Earnings update|Deal watch|News alert)\.\s*/i, "")
    .replace(/>([A-Z]{1,6})(?:\b|$)/g, "")
    .replace(/\bBRIEF[-:]\s*/i, "")
    .replace(/\bQ([1-4])\b/gi, "quarter $1")
    .replace(/\b([1-4])Q\b/gi, "$1 quarter")
    .replace(/\bAdj\.?\b/gi, "adjusted")
    .replace(/\bEPS\b/g, "E P S")
    .replace(/\bRev\b/gi, "revenue")
    .replace(/\bShr\b/gi, "share")
    .replace(/\bVs\.?\b/gi, "versus")
    .replace(/\bUSD\b/g, "U S dollars")
    .replace(/\bIBES\b/g, "I B E S")
    .replace(/\bM&A\b/g, "M and A")
    .replace(/\bCEO\b/g, "C E O")
    .replace(/\bCFO\b/g, "C F O")
    .replace(/\bYOY\b/g, "year over year")
    .replace(/\bY\/Y\b/g, "year over year")
    .replace(/\bQoQ\b/g, "quarter over quarter")
    .replace(/\$(\d+(?:\.\d+)?)B\b/g, "$1 billion dollars")
    .replace(/\$(\d+(?:\.\d+)?)M\b/g, "$1 million dollars")
    .replace(/\b(\d+(?:\.\d+)?)B\b/g, "$1 billion")
    .replace(/\b(\d+(?:\.\d+)?)M\b/g, "$1 million")
    .replace(/\s+/g, " ")
    .trim();

  text = improveQuarterPhrase(text);
  text = improveMarketPhrases(text);
  text = addCompanyContext(text, leadTicker);
  text = addTickerTail(text, tickers);

  return text;
}

const COMPANY_HINTS = new Map([
  ["NVDA", "Nvidia"],
  ["AAPL", "Apple"],
  ["MSFT", "Microsoft"],
  ["AMZN", "Amazon"],
  ["GOOGL", "Alphabet"],
  ["GOOG", "Alphabet"],
  ["META", "Meta"],
  ["TSLA", "Tesla"],
  ["AMD", "AMD"],
  ["NFLX", "Netflix"]
]);

function improveQuarterPhrase(text) {
  return text
    .replace(/\b1 quarter\b/gi, "first quarter")
    .replace(/\b2 quarter\b/gi, "second quarter")
    .replace(/\b3 quarter\b/gi, "third quarter")
    .replace(/\b4 quarter\b/gi, "fourth quarter")
    .replace(/\bquarter 1\b/gi, "first quarter")
    .replace(/\bquarter 2\b/gi, "second quarter")
    .replace(/\bquarter 3\b/gi, "third quarter")
    .replace(/\bquarter 4\b/gi, "fourth quarter");
}

function improveMarketPhrases(text) {
  return text
    .replace(/\bSees second quarter revenue\b/i, "guides second quarter revenue to")
    .replace(/\bSees first quarter revenue\b/i, "guides first quarter revenue to")
    .replace(/\bSees third quarter revenue\b/i, "guides third quarter revenue to")
    .replace(/\bSees fourth quarter revenue\b/i, "guides fourth quarter revenue to")
    .replace(/\bPlus or Minus\b/gi, "plus or minus")
    .replace(/\bPrice Target Maintained With a\b/gi, "price target maintained at")
    .replace(/\/Share\b/gi, "per share")
    .replace(/\bIs Maintained at\b/gi, "is maintained at");
}

function addCompanyContext(text, leadTicker) {
  if (/revenue|E P S|earnings|guidance|forecast|guides|sees/i.test(text)) {
    const company = leadTicker ? COMPANY_HINTS.get(leadTicker) : "";
    return company && !text.toLowerCase().startsWith(company.toLowerCase())
      ? `${company}. ${text}`
      : text;
  }

  return text;
}

function addTickerTail(text, tickers) {
  const uniqueTickers = [...new Set(tickers)].slice(0, 3);
  if (!uniqueTickers.length) {
    return text;
  }

  const spoken = uniqueTickers.map((ticker) => ticker.split("").join(" ")).join(", ");
  return `${text}. Ticker ${spoken}.`;
}

async function loadSeenCache() {
  const saved = await chrome.storage.local.get({
    [SEEN_CACHE_KEY]: [],
    [FORCE_READ_TOP_KEY]: 0
  });
  const entries = Array.isArray(saved[SEEN_CACHE_KEY]) ? saved[SEEN_CACHE_KEY] : [];
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const freshEntries = entries.filter((entry) => entry?.key && entry.seenAt > cutoff);

  state.seen = new Map(freshEntries.map((entry) => [entry.key, entry.seenAt]));
  state.hadSeenCache = state.seen.size > 0;
  state.forceReadTopOnLoad = Date.now() - Number(saved[FORCE_READ_TOP_KEY] || 0) < 2 * 60 * 1000;

  if (state.forceReadTopOnLoad) {
    await chrome.storage.local.remove(FORCE_READ_TOP_KEY);
  }
}

function scheduleSeenPersist() {
  window.clearTimeout(state.persistTimer);
  state.persistTimer = window.setTimeout(persistSeenCache, 500);
}

async function persistSeenCache() {
  const entries = [...state.seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)
    .map(([key, seenAt]) => ({ key, seenAt }));

  await chrome.storage.local.set({ [SEEN_CACHE_KEY]: entries });
}

function startAutoRefresh() {
  window.clearInterval(state.refreshTimer);

  const minutes = Number(state.settings.refreshIntervalMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return;
  }

  state.refreshTimer = window.setInterval(() => {
    updateBadge("Refreshing");
    window.location.reload();
  }, minutes * 60 * 1000);
}

function isCurrentSourceEnabled() {
  return state.settings.enabledSources?.[currentSource.id] !== false;
}
