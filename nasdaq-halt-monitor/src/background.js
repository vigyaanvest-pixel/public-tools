const SOURCE_URL = "https://www.nasdaqtrader.com/trader.aspx?id=TradeHalts";
const ALARM_NAME = "nasdaq-halt-monitor.check";
let activeCheckPromise = null;
let activeSetupPromise = null;

const DEFAULT_SETTINGS = {
  enabled: false,
  intervalSeconds: 15,
  alertAllSymbols: true,
  watchlistText: "",
  reasonCodes: ["LUDP", "LUDS", "T1", "T2"],
  onlyOpenHalts: true
};

function chromeGet(keys) {
  return chrome.storage.local.get(keys);
}

function chromeSet(values) {
  return chrome.storage.local.set(values);
}

async function getSettings() {
  const stored = await chromeGet(["settings"]);
  const settings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };

  if (!settings.intervalSeconds && settings.intervalMinutes) {
    settings.intervalSeconds = Math.max(5, Math.round(settings.intervalMinutes * 60));
  }

  return settings;
}

async function saveSettings(settings) {
  const nextSettings = { ...DEFAULT_SETTINGS, ...settings };
  await chromeSet({ settings: nextSettings });
  await scheduleAlarm(nextSettings);
  return nextSettings;
}

function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase();
}

function parseWatchlist(text) {
  return new Set(
    String(text || "")
      .split(/[\s,;]+/)
      .map(normalizeSymbol)
      .filter(Boolean)
  );
}

function haltKey(halt) {
  return `${halt.symbol}|${halt.haltDate}|${halt.haltTime}|${halt.reasonCode}`;
}

async function getNotificationPermissionLevel() {
  try {
    return await chrome.notifications.getPermissionLevel();
  } catch (error) {
    return `unknown: ${error?.message || error}`;
  }
}

async function createDesktopNotification(prefix, options) {
  const notificationId = `${prefix}-${Date.now()}`;
  const createdId = await chrome.notifications.create(notificationId, {
    eventTime: Date.now(),
    priority: 2,
    silent: false,
    ...options,
    iconUrl: chrome.runtime.getURL("assets/icon-128.png")
  });
  return createdId || notificationId;
}

async function scheduleAlarm(settings = null) {
  const nextSettings = settings || (await getSettings());
  await chrome.alarms.clear(ALARM_NAME);

  if (nextSettings.enabled) {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: 1
    });
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeScriptWithRetry(details, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      return await chrome.scripting.executeScript(details);
    } catch (error) {
      lastError = error;
      await delay(350);
    }
  }

  throw lastError || new Error("Timed out injecting Nasdaq halt scraper.");
}

async function scrapeTradeHaltsInPage(options) {
  const timeoutAt = Date.now() + 12000;

  while (Date.now() < timeoutAt) {
    if (globalThis.NasdaqHaltParser) {
      const rows = globalThis.NasdaqHaltParser.extractRowsFromDocument(document);
      const halts = globalThis.NasdaqHaltParser.parseTradeHaltRows(rows, options);

      if (rows.length > 1 || document.querySelector("#divTradeHaltResults")) {
        return { rowsFound: rows.length, halts };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return { rowsFound: 0, halts: [] };
}

function startNasdaqPageRefresh(intervalMs) {
  if (globalThis.__vvNasdaqHaltRefreshTimer) {
    clearInterval(globalThis.__vvNasdaqHaltRefreshTimer);
  }

  function refreshTradeHalts() {
    const resultContainer = document.getElementById("divTradeHaltResults");
    const api = globalThis.Server?.BL_TradeHalt?.GetTradeHalts;

    if (!resultContainer || typeof api !== "function") {
      return;
    }

    api((html, error) => {
      if (!error && html) {
        resultContainer.innerHTML = html;
      }
    });
  }

  refreshTradeHalts();
  globalThis.__vvNasdaqHaltRefreshTimer = setInterval(
    refreshTradeHalts,
    Math.max(5000, intervalMs)
  );
}

function startNasdaqDomMonitor(options, pollMs) {
  if (globalThis.__vvNasdaqHaltDomTimer) {
    clearInterval(globalThis.__vvNasdaqHaltDomTimer);
  }

  async function publishHalts() {
    const parser = globalThis.NasdaqHaltParser;
    if (!parser) {
      return;
    }

    const rows = parser.extractRowsFromDocument(document);
    const halts = parser.parseTradeHaltRows(rows, options);

    if (rows.length > 1) {
      chrome.runtime.sendMessage({
        type: "HALTS_DETECTED",
        checkedAt: new Date().toISOString(),
        rowsFound: rows.length,
        halts
      });
    }
  }

  publishHalts();
  globalThis.__vvNasdaqHaltDomTimer = setInterval(
    publishHalts,
    Math.max(3000, pollMs)
  );
}

function stopNasdaqPageMonitors() {
  if (globalThis.__vvNasdaqHaltRefreshTimer) {
    clearInterval(globalThis.__vvNasdaqHaltRefreshTimer);
    globalThis.__vvNasdaqHaltRefreshTimer = null;
  }

  if (globalThis.__vvNasdaqHaltDomTimer) {
    clearInterval(globalThis.__vvNasdaqHaltDomTimer);
    globalThis.__vvNasdaqHaltDomTimer = null;
  }
}

async function getMonitorTabId() {
  const stored = await chromeGet(["monitorTabId"]);
  return stored.monitorTabId || null;
}

async function ensureMonitorTab() {
  const existingTabId = await getMonitorTabId();

  if (existingTabId) {
    try {
      const existingTab = await chrome.tabs.get(existingTabId);
      if (existingTab?.url?.startsWith("https://www.nasdaqtrader.com/")) {
        return existingTabId;
      }
    } catch (_) {
      // Fall through and create a fresh monitor tab.
    }
  }

  const matchingTabs = await chrome.tabs.query({ url: SOURCE_URL });
  const reusableTab = matchingTabs.find((tab) => !tab.active) || matchingTabs[0];

  if (reusableTab?.id) {
    await chromeSet({ monitorTabId: reusableTab.id });
    return reusableTab.id;
  }

  const tab = await chrome.tabs.create({ url: SOURCE_URL, active: false });
  await chromeSet({ monitorTabId: tab.id });
  return tab.id;
}

async function setupLiveMonitor(settings = null) {
  if (activeSetupPromise) {
    return activeSetupPromise;
  }

  activeSetupPromise = (async () => {
    const nextSettings = settings || (await getSettings());

    if (!nextSettings.enabled) {
      await stopLiveMonitor();
      return { ok: true, enabled: false };
    }

    const tabId = await ensureMonitorTab();
    const intervalSeconds = Math.max(5, Number(nextSettings.intervalSeconds) || 15);
    await delay(800);

    await executeScriptWithRetry({
      target: { tabId },
      files: ["src/trade-halt-parser.js"]
    });

    await executeScriptWithRetry({
      target: { tabId },
      world: "MAIN",
      func: startNasdaqPageRefresh,
      args: [intervalSeconds * 1000]
    });

    await executeScriptWithRetry({
      target: { tabId },
      func: startNasdaqDomMonitor,
      args: [
        {
          reasonCodes: nextSettings.reasonCodes,
          onlyOpenHalts: nextSettings.onlyOpenHalts
        },
        Math.min(5000, intervalSeconds * 1000)
      ]
    });

    return { ok: true, enabled: true, tabId, intervalSeconds };
  })();

  try {
    return await activeSetupPromise;
  } finally {
    activeSetupPromise = null;
  }
}

async function stopLiveMonitor() {
  const tabId = await getMonitorTabId();

  if (tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: stopNasdaqPageMonitors
      });
    } catch (_) {
      // The tab may already be gone.
    }

    try {
      await chrome.tabs.remove(tabId);
    } catch (_) {
      // The tab may already be gone.
    }
  }

  await chromeSet({ monitorTabId: null });
}

async function scrapeCurrentTradeHalts(settings) {
  const tab = await chrome.tabs.create({ url: SOURCE_URL, active: false });

  try {
    await delay(700);
    await executeScriptWithRetry({
      target: { tabId: tab.id },
      files: ["src/trade-halt-parser.js"]
    });

    const results = await executeScriptWithRetry({
      target: { tabId: tab.id },
      func: scrapeTradeHaltsInPage,
      args: [
        {
          reasonCodes: settings.reasonCodes,
          onlyOpenHalts: settings.onlyOpenHalts
        }
      ]
    });

    return results?.[0]?.result || { rowsFound: 0, halts: [] };
  } finally {
    if (tab?.id) {
      chrome.tabs.remove(tab.id).catch(() => {});
    }
  }
}

function filterHaltsForSettings(halts, settings) {
  const watchlist = parseWatchlist(settings.watchlistText);

  if (settings.alertAllSymbols || watchlist.size === 0) {
    return halts;
  }

  return halts.filter((halt) => watchlist.has(normalizeSymbol(halt.symbol)));
}

async function notifyForNewHalts(halts) {
  const stored = await chromeGet(["alertedHaltKeys"]);
  const alertedHaltKeys = new Set(stored.alertedHaltKeys || []);
  const newHalts = halts.filter((halt) => !alertedHaltKeys.has(haltKey(halt)));

  if (newHalts.length === 0) {
    return [];
  }

  const message = newHalts
    .slice(0, 6)
    .map((halt) => `${halt.symbol} ${halt.reasonCode} ${halt.haltTime}`)
    .join(", ");
  const overflow = newHalts.length > 6 ? ` +${newHalts.length - 6} more` : "";

  await createDesktopNotification("nasdaq-halt-alert", {
    type: "basic",
    title: "VigyaanVest.com Nasdaq Halt Alert",
    message: `Halts: ${message}${overflow} | ${new Date().toLocaleTimeString()}`,
    requireInteraction: true
  });

  await chrome.action.setBadgeBackgroundColor({ color: "#f7b52d" });
  await chrome.action.setBadgeText({
    text: String(Math.min(newHalts.length, 99))
  });

  newHalts.forEach((halt) => alertedHaltKeys.add(haltKey(halt)));
  await chromeSet({ alertedHaltKeys: Array.from(alertedHaltKeys).slice(-500) });
  return newHalts;
}

async function sendTestNotification() {
  const permissionLevel = await getNotificationPermissionLevel();
  const existingNotifications = await chrome.notifications.getAll();

  await Promise.all(
    Object.keys(existingNotifications).map((notificationId) =>
      chrome.notifications.clear(notificationId).catch(() => false)
    )
  );

  const notificationId = await createDesktopNotification("nasdaq-halt-test", {
    type: "basic",
    title: "VigyaanVest.com Nasdaq Halt Monitor",
    message: `Desktop halt alerts are working. ${new Date().toLocaleTimeString()}`,
    requireInteraction: true
  });
  await chrome.action.setBadgeBackgroundColor({ color: "#1fbf7d" });
  await chrome.action.setBadgeText({ text: "OK" });
  const lastNotification = {
    notificationId,
    permissionLevel,
    sentAt: new Date().toISOString()
  };
  await chromeSet({ lastNotification });
  return lastNotification;
}

async function runCheckInternal() {
  const settings = await getSettings();
  const checkedAt = new Date().toISOString();

  try {
    const scraped = await scrapeCurrentTradeHalts(settings);
    const matchingHalts = filterHaltsForSettings(scraped.halts || [], settings);
    const newHalts = await notifyForNewHalts(matchingHalts);

    const lastCheck = {
      ok: true,
      checkedAt,
      rowsFound: scraped.rowsFound || 0,
      matchingCount: matchingHalts.length,
      newCount: newHalts.length,
      error: ""
    };

    await chromeSet({ lastCheck, lastHalts: matchingHalts.slice(0, 20) });
    return { lastCheck, lastHalts: matchingHalts };
  } catch (error) {
    const lastCheck = {
      ok: false,
      checkedAt,
      rowsFound: 0,
      matchingCount: 0,
      newCount: 0,
      error: error?.message || String(error)
    };

    await chromeSet({ lastCheck });
    return { lastCheck, lastHalts: [] };
  }
}

async function handleDetectedHalts(message) {
  const settings = await getSettings();
  const matchingHalts = filterHaltsForSettings(message.halts || [], settings);
  const newHalts = await notifyForNewHalts(matchingHalts);

  const lastCheck = {
    ok: true,
    checkedAt: message.checkedAt || new Date().toISOString(),
    rowsFound: message.rowsFound || 0,
    matchingCount: matchingHalts.length,
    newCount: newHalts.length,
    error: ""
  };

  await chromeSet({ lastCheck, lastHalts: matchingHalts.slice(0, 20) });
  return { lastCheck, lastHalts: matchingHalts };
}

async function runCheck() {
  if (activeCheckPromise) {
    return activeCheckPromise;
  }

  activeCheckPromise = runCheckInternal();

  try {
    return await activeCheckPromise;
  } finally {
    activeCheckPromise = null;
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chromeGet(["settings"]);
  if (!stored.settings) {
    await chromeSet({ settings: DEFAULT_SETTINGS });
  }
  await scheduleAlarm();
  await setupLiveMonitor();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleAlarm();
  setupLiveMonitor();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    setupLiveMonitor();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "GET_STATE") {
      const [settings, stored] = await Promise.all([
        getSettings(),
        chromeGet(["lastCheck", "lastHalts", "alertedHaltKeys", "lastNotification"])
      ]);
      const notificationPermission = await getNotificationPermissionLevel();
      sendResponse({
        settings,
        ...stored,
        notificationPermission,
        sourceUrl: SOURCE_URL
      });
      return;
    }

    if (message?.type === "SAVE_SETTINGS") {
      const settings = await saveSettings(message.settings || {});
      const monitor = await setupLiveMonitor(settings);
      sendResponse({ settings, monitor });
      return;
    }

    if (message?.type === "START_MONITORING") {
      const settings = await saveSettings({ ...(await getSettings()), enabled: true });
      const monitor = await setupLiveMonitor(settings);
      sendResponse({ settings, monitor });
      return;
    }

    if (message?.type === "STOP_MONITORING") {
      const settings = await saveSettings({ ...(await getSettings()), enabled: false });
      await stopLiveMonitor();
      sendResponse({ settings });
      return;
    }

    if (message?.type === "RUN_CHECK_NOW") {
      const result = await runCheck();
      sendResponse(result);
      return;
    }

    if (message?.type === "RESET_ALERT_MEMORY") {
      await chromeSet({ alertedHaltKeys: [] });
      await chrome.action.setBadgeText({ text: "" });
      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "TEST_NOTIFICATION") {
      const result = await sendTestNotification();
      sendResponse({ ok: true, ...result });
      return;
    }

    if (message?.type === "OPEN_SOURCE_PAGE") {
      await chrome.tabs.create({ url: SOURCE_URL, active: true });
      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "HALTS_DETECTED") {
      const result = await handleDetectedHalts(message);
      sendResponse({ ok: true, ...result });
    }
  })().catch((error) => {
    sendResponse({ error: error?.message || String(error) });
  });

  return true;
});
