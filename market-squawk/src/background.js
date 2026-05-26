importScripts("sources.js");

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

const FORCE_READ_TOP_KEY = "marketSquawkForceReadTopOnLoad";
let batchProtectedUntil = 0;

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

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...current });
  reloadSupportedTabs();
});

chrome.runtime.onStartup.addListener(() => {
  reloadSupportedTabs();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SQUAWK_SPEAK") {
    speak(message.text, { force: Boolean(message.force) }).then(sendResponse);
    return true;
  }

  if (message?.type === "SQUAWK_SPEAK_BATCH") {
    speakBatch(message.texts || [], { force: Boolean(message.force) }).then(sendResponse);
    return true;
  }

  if (message?.type === "SQUAWK_STOP") {
    chrome.tts.stop();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "SQUAWK_TEST_VOICE") {
    speak("Voice test. Market Squawk is using this selected voice.", { force: true }).then(sendResponse);
    return true;
  }

  if (message?.type === "SQUAWK_PREVIEW") {
    sendResponse({ text: formatForSpeech(message.text || "") });
    return true;
  }

  if (message?.type === "SQUAWK_GET_VOICES") {
    chrome.tts.getVoices((voices) => {
      sendResponse({
        voices: voices
          .filter((voice) => !voice.lang || /^en[-_]/i.test(voice.lang))
          .map((voice) => ({
            voiceKey: getVoiceKey(voice),
            voiceName: voice.voiceName,
            lang: voice.lang || "",
            extensionId: voice.extensionId || ""
          }))
      });
    });
    return true;
  }

  if (message?.type === "SQUAWK_GET_SOURCES") {
    sendResponse({ sources: globalThis.MarketSquawkSources.SOURCE_PROFILES });
    return true;
  }

  if (message?.type === "SQUAWK_RELOAD_SUPPORTED_TABS") {
    reloadSupportedTabs();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type !== "GET_TAB_STATUS") {
    return false;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const source = tab?.url ? globalThis.MarketSquawkSources.detectSourceForUrl(tab.url) : null;
    if (!tab?.id || !source) {
      sendResponse({ supported: false });
      return;
    }

    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      if (settings.enabledSources?.[source.id] === false) {
        sendResponse({
          supported: true,
          disabled: true,
          sourceName: source.name,
          ready: false,
          headlineCount: 0,
          sample: ""
        });
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: "SQUAWK_STATUS" }, (response) => {
        sendResponse({
          supported: true,
          sourceName: source.name,
          ready: !chrome.runtime.lastError && Boolean(response?.ready),
          headlineCount: response?.headlineCount ?? 0,
          sample: response?.sample ?? ""
        });
      });
    });
  });

  return true;
});

async function speak(text, { force = false } = {}) {
  const saved = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...saved };

  if ((!settings.enabled && !force) || !text) {
    return;
  }

  const alreadyFormatted = /\.\s+Ticker\s+[A-Z](?:\s+[A-Z])?(?:,|\.)/i.test(text);
  const spokenText = settings.smartSpeech && !alreadyFormatted
    ? formatForSpeech(text)
    : text;
  const voiceOptions = await getSelectedVoiceOptions(settings);

  return new Promise((resolve) => {
    chrome.tts.stop();
    chrome.tts.speak(spokenText, {
      enqueue: false,
      rate: Number(settings.rate) || DEFAULT_SETTINGS.rate,
      pitch: Number(settings.pitch) || DEFAULT_SETTINGS.pitch,
      volume: Number(settings.volume) || DEFAULT_SETTINGS.volume,
      ...voiceOptions
    }, () => {
      const error = chrome.runtime.lastError?.message || "";
      resolve({
        ok: !error,
        error,
        voiceName: voiceOptions.voiceName || "System default",
        extensionId: voiceOptions.extensionId || ""
      });
    });
  });
}

async function speakBatch(texts, { force = false } = {}) {
  const saved = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...saved };

  if (!settings.enabled || !Array.isArray(texts) || !texts.length) {
    return { ok: false };
  }

  if (!force && Date.now() < batchProtectedUntil) {
    return { ok: true, skipped: true, reason: "batch protected" };
  }

  const voiceOptions = await getSelectedVoiceOptions(settings);
  const utterances = texts.filter(Boolean);
  if (!utterances.length) {
    return { ok: false };
  }

  batchProtectedUntil = Date.now() + Math.min(90000, Math.max(12000, utterances.length * 8000));
  chrome.tts.stop();

  const results = await Promise.all(utterances.map((text, index) => new Promise((resolve) => {
    chrome.tts.speak(text, {
      enqueue: index > 0,
      rate: Number(settings.rate) || DEFAULT_SETTINGS.rate,
      pitch: Number(settings.pitch) || DEFAULT_SETTINGS.pitch,
      volume: Number(settings.volume) || DEFAULT_SETTINGS.volume,
      ...voiceOptions
    }, () => {
      const error = chrome.runtime.lastError?.message || "";
      resolve({
        ok: !error,
        error
      });
    });
  })));

  return {
    ok: results.every((result) => result.ok),
    count: results.length,
    errors: results.map((result) => result.error).filter(Boolean)
  };
}

function getVoiceKey(voice) {
  return `${voice.extensionId || "native"}::${voice.voiceName}`;
}

async function getSelectedVoiceOptions(settings) {
  const voices = await new Promise((resolve) => chrome.tts.getVoices(resolve));
  const selected = voices.find((voice) => settings.voiceKey && getVoiceKey(voice) === settings.voiceKey) ||
    voices.find((voice) => settings.voiceName && voice.voiceName === settings.voiceName);

  if (!selected) {
    return {};
  }

  return {
    voiceName: selected.voiceName,
    extensionId: selected.extensionId || undefined,
    lang: selected.lang || undefined
  };
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

function addCompanyContext(text, leadTicker) {
  if (/revenue|E P S|earnings|guidance|forecast|sees/i.test(text)) {
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

function improveMarketPhrases(text) {
  return text
    .replace(/\bSees second quarter revenue\b/i, "guides second quarter revenue to")
    .replace(/\bSees first quarter revenue\b/i, "guides first quarter revenue to")
    .replace(/\bSees third quarter revenue\b/i, "guides third quarter revenue to")
    .replace(/\bSees fourth quarter revenue\b/i, "guides fourth quarter revenue to")
    .replace(/\bPlus or Minus\b/gi, "plus or minus")
    .replace(/\bPrice Target Maintained With a\b/gi, "price target maintained at")
    .replace(/\/Share\b/gi, "per share")
    .replace(/\bIs Maintained at\b/gi, "is maintained at")
    .replace(/\bRaises\b/gi, "raises")
    .replace(/\bRaised to\b/gi, "raised to")
    .replace(/\bImplies\b/gi, "implies");
}

globalThis.marketSquawkFormatForSpeech = formatForSpeech;

function reloadSupportedTabs() {
  chrome.tabs.query({}, (tabs) => {
    const supportedTabs = tabs.filter((tab) => tab.url && globalThis.MarketSquawkSources.detectSourceForUrl(tab.url));
    if (supportedTabs.length) {
      chrome.storage.local.set({ [FORCE_READ_TOP_KEY]: Date.now() });
    }

    supportedTabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
}
