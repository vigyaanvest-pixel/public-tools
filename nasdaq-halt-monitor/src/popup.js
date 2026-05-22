const fields = {
  enabled: document.getElementById("enabled"),
  intervalMinutes: document.getElementById("intervalMinutes"),
  alertAllSymbols: document.getElementById("alertAllSymbols"),
  watchlistText: document.getElementById("watchlistText"),
  onlyOpenHalts: document.getElementById("onlyOpenHalts"),
  statusText: document.getElementById("statusText"),
  halts: document.getElementById("halts")
};

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function selectedReasonCodes() {
  return Array.from(document.querySelectorAll(".reason:checked")).map(
    (input) => input.value
  );
}

function applySettings(settings) {
  fields.enabled.checked = Boolean(settings.enabled);
  fields.intervalMinutes.value =
    settings.intervalSeconds || Math.max(5, Math.round((settings.intervalMinutes || 0) * 60)) || 15;
  fields.alertAllSymbols.checked = Boolean(settings.alertAllSymbols);
  fields.watchlistText.value = settings.watchlistText || "";
  fields.onlyOpenHalts.checked = settings.onlyOpenHalts !== false;

  document.querySelectorAll(".reason").forEach((input) => {
    input.checked = (settings.reasonCodes || []).includes(input.value);
  });
}

function readSettings() {
  return {
    enabled: fields.enabled.checked,
    intervalSeconds: Math.max(5, Number(fields.intervalMinutes.value) || 15),
    alertAllSymbols: fields.alertAllSymbols.checked,
    watchlistText: fields.watchlistText.value,
    onlyOpenHalts: fields.onlyOpenHalts.checked,
    reasonCodes: selectedReasonCodes()
  };
}

function formatTime(isoValue) {
  if (!isoValue) {
    return "Never checked";
  }

  return new Date(isoValue).toLocaleString();
}

function renderState(state) {
  applySettings(state.settings);
  const alertStatus = state.notificationPermission
    ? ` | Alerts: ${state.notificationPermission}`
    : "";
  const lastNotificationStatus = state.lastNotification
    ? ` | Last alert: ${formatTime(state.lastNotification.sentAt)}`
    : "";

  const lastCheck = state.lastCheck;
  if (!lastCheck) {
    fields.statusText.textContent = `Saved. No check has run yet.${alertStatus}${lastNotificationStatus}`;
    fields.halts.textContent = "";
    return;
  }

  const status = lastCheck.ok ? "OK" : "Error";
  fields.statusText.textContent = `${status} | Last check: ${formatTime(
    lastCheck.checkedAt
  )} | Matching halts: ${lastCheck.matchingCount}${alertStatus}${lastNotificationStatus}`;

  if (!lastCheck.ok) {
    fields.halts.textContent = lastCheck.error || "Unknown error.";
    return;
  }

  const lastHalts = state.lastHalts || [];
  fields.halts.textContent =
    lastHalts.length > 0
      ? lastHalts
          .map((halt) => `${halt.symbol} ${halt.reasonCode} ${halt.haltTime}`)
          .join(" | ")
      : "No matching open halts found.";
}

async function loadState() {
  const state = await sendMessage({ type: "GET_STATE" });
  renderState(state);
}

async function saveSettings() {
  fields.statusText.textContent = "Saving...";
  await sendMessage({ type: "SAVE_SETTINGS", settings: readSettings() });
  await loadState();
}

document.getElementById("save").addEventListener("click", saveSettings);

document.getElementById("checkNow").addEventListener("click", async () => {
  fields.statusText.textContent = "Checking Nasdaq...";
  const result = await sendMessage({ type: "RUN_CHECK_NOW" });
  renderState({ settings: readSettings(), ...result });
});

document.getElementById("openSource").addEventListener("click", () => {
  sendMessage({ type: "OPEN_SOURCE_PAGE" });
});

document.getElementById("testNotification").addEventListener("click", async () => {
  fields.statusText.textContent = "Sending test alert...";
  const result = await sendMessage({ type: "TEST_NOTIFICATION" });
  fields.statusText.textContent = result?.error
    ? `Alert error: ${result.error}`
    : `Test alert sent. Permission: ${result.permissionLevel}. ID: ${result.notificationId}`;
});

document.getElementById("resetMemory").addEventListener("click", async () => {
  await sendMessage({ type: "RESET_ALERT_MEMORY" });
  fields.statusText.textContent = "Alert memory reset.";
});

fields.enabled.addEventListener("change", saveSettings);
fields.alertAllSymbols.addEventListener("change", saveSettings);
fields.onlyOpenHalts.addEventListener("change", saveSettings);

loadState();
