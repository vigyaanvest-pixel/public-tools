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

const elements = {
  enabled: document.getElementById("enabled"),
  status: document.getElementById("status"),
  voice: document.getElementById("voice"),
  rate: document.getElementById("rate"),
  rateValue: document.getElementById("rateValue"),
  volume: document.getElementById("volume"),
  volumeValue: document.getElementById("volumeValue"),
  topWindow: document.getElementById("topWindow"),
  refreshIntervalMinutes: document.getElementById("refreshIntervalMinutes"),
  smartSpeech: document.getElementById("smartSpeech"),
  readTopOnLoad: document.getElementById("readTopOnLoad"),
  honorReadMemory: document.getElementById("honorReadMemory"),
  sourceList: document.getElementById("sourceList"),
  readTop: document.getElementById("readTop"),
  stop: document.getElementById("stop")
};

function setStatus(text) {
  elements.status.textContent = text;
}

function updateOutputs() {
  elements.rateValue.textContent = `${Number(elements.rate.value).toFixed(1)}x`;
  elements.volumeValue.textContent = `${Math.round(Number(elements.volume.value) * 100)}%`;
}

function loadVoices(voices, selectedKey = "", selectedName = "") {
  elements.voice.replaceChildren();
  elements.voice.append(new Option("System default", ""));

  voices
    .sort((a, b) => a.voiceName.localeCompare(b.voiceName))
    .forEach((voice) => {
      const label = voice.lang ? `${voice.voiceName} (${voice.lang})` : voice.voiceName;
      elements.voice.append(new Option(label, voice.voiceKey));
    });

  const fallback = voices.find((voice) => voice.voiceName === selectedName)?.voiceKey || "";
  elements.voice.value = selectedKey || fallback;
}

async function saveSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
}

async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let targetTab = tab;
  const activeSource = targetTab?.url ? globalThis.MarketSquawkSources.detectSourceForUrl(targetTab.url) : null;

  if (!targetTab?.id || !activeSource) {
    const tabs = await chrome.tabs.query({});
    const supportedTabs = tabs.filter((candidate) => candidate.url && globalThis.MarketSquawkSources.detectSourceForUrl(candidate.url));
    targetTab = supportedTabs.find((candidate) => candidate.active) || supportedTabs[0];
  }

  if (!targetTab?.id) {
    setStatus("Open a supported market news page first.");
    return null;
  }

  try {
    return await chrome.tabs.sendMessage(targetTab.id, message);
  } catch (_error) {
    setStatus("Refresh the TradingView tab, then try again.");
    return null;
  }
}

async function init() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const voiceResponse = await chrome.runtime.sendMessage({ type: "SQUAWK_GET_VOICES" });
  const sourceResponse = await chrome.runtime.sendMessage({ type: "SQUAWK_GET_SOURCES" });

  elements.enabled.checked = Boolean(settings.enabled);
  elements.rate.value = settings.rate;
  elements.volume.value = settings.volume;
  elements.topWindow.value = settings.topWindow;
  elements.refreshIntervalMinutes.value = settings.refreshIntervalMinutes;
  elements.smartSpeech.checked = Boolean(settings.smartSpeech);
  elements.readTopOnLoad.checked = Boolean(settings.readTopOnLoad);
  elements.honorReadMemory.checked = Boolean(settings.honorReadMemory);
  loadVoices(voiceResponse?.voices || [], settings.voiceKey, settings.voiceName);
  renderSourceToggles(sourceResponse?.sources || [], settings.enabledSources || {});
  updateOutputs();

  chrome.runtime.sendMessage({ type: "GET_TAB_STATUS" }, (response) => {
    if (!response?.supported) {
      setStatus("Open TradingView, Finviz, MarketWatch, or Zerodha Pulse.");
      return;
    }

    if (response.disabled) {
      setStatus(`${response.sourceName} is disabled in Sources.`);
      return;
    }

    if (response.ready) {
      const suffix = response.sample ? ` Top: ${response.sample}` : "";
      const sourceLabel = response.sourceName ? `${response.sourceName}: ` : "";
      setStatus(`${sourceLabel}${response.headlineCount} headlines detected.${suffix}`);
    } else {
      setStatus(`Waiting for ${response.sourceName || "the source"} to load.`);
    }
  });
}

elements.enabled.addEventListener("change", () => {
  saveSetting("enabled", elements.enabled.checked);
});

function renderSourceToggles(sources, enabledSources) {
  elements.sourceList.replaceChildren();

  sources.forEach((source) => {
    const row = document.createElement("div");
    row.className = "source-toggle";

    const label = document.createElement("label");
    label.className = "source-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabledSources[source.id] !== false;
    checkbox.addEventListener("change", async () => {
      const current = await chrome.storage.sync.get({ enabledSources: {} });
      const next = { ...(current.enabledSources || {}) };
      if (checkbox.checked) {
        delete next[source.id];
      } else {
        next[source.id] = false;
      }
      await chrome.storage.sync.set({ enabledSources: next });
      await chrome.runtime.sendMessage({ type: "SQUAWK_RELOAD_SUPPORTED_TABS" });
      setStatus(`${source.name} ${checkbox.checked ? "enabled" : "disabled"}.`);
    });

    const name = document.createElement("span");
    name.textContent = source.name;

    label.append(checkbox, name);

    const link = document.createElement("a");
    link.href = source.startUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "source-link";
    link.textContent = "Open";
    link.title = `Open ${source.name}`;
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await chrome.tabs.create({ url: source.startUrl });
      window.close();
    });

    row.append(label, link);
    elements.sourceList.append(row);
  });
}

elements.voice.addEventListener("change", async () => {
  const selected = elements.voice.selectedOptions[0];
  await chrome.storage.sync.set({
    voiceKey: elements.voice.value,
    voiceName: selected?.textContent?.split(" (")[0] || "",
    voiceURI: "",
  });
  setStatus(elements.voice.value ? `Voice set: ${selected.textContent}` : "Using system default voice.");
});

elements.rate.addEventListener("input", () => {
  updateOutputs();
  saveSetting("rate", Number(elements.rate.value));
});

elements.volume.addEventListener("input", () => {
  updateOutputs();
  saveSetting("volume", Number(elements.volume.value));
});

elements.topWindow.addEventListener("change", () => {
  const value = Math.max(1, Math.min(20, Number(elements.topWindow.value) || DEFAULT_SETTINGS.topWindow));
  elements.topWindow.value = value;
  saveSetting("topWindow", value);
});

elements.refreshIntervalMinutes.addEventListener("change", () => {
  const value = Math.max(0, Math.min(1440, Number(elements.refreshIntervalMinutes.value) || 0));
  elements.refreshIntervalMinutes.value = value;
  saveSetting("refreshIntervalMinutes", value);
});

elements.smartSpeech.addEventListener("change", () => {
  saveSetting("smartSpeech", elements.smartSpeech.checked);
});

elements.readTopOnLoad.addEventListener("change", () => {
  saveSetting("readTopOnLoad", elements.readTopOnLoad.checked);
});

elements.honorReadMemory.addEventListener("change", () => {
  saveSetting("honorReadMemory", elements.honorReadMemory.checked);
});

elements.readTop.addEventListener("click", async () => {
  const response = await sendToActiveTab({ type: "SQUAWK_READ_TOP" });
  if (response?.ok) {
    setStatus(`Reading ${response.count || 1}: ${response.headline}`);
  } else if (response) {
    setStatus("No news row detected on the page.");
  }
});

elements.stop.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SQUAWK_STOP" });
  await sendToActiveTab({ type: "SQUAWK_STOP" });
});

document.getElementById("testVoice").addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "SQUAWK_TEST_VOICE" });
  const engine = response?.extensionId ? "Edge voice" : "System";
  setStatus(response?.ok ? `Playing voice: ${response.voiceName} (${engine})` : `Voice error: ${response?.error || "unknown"}`);
});

document.getElementById("vigyaanvestCta").addEventListener("click", async (event) => {
  event.preventDefault();
  await chrome.tabs.create({ url: "https://vigyaanvest.com" });
  window.close();
});

init();
