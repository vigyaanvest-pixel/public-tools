import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles/app.css";
import {
  APP_NAME,
  DEFAULT_SETTINGS,
  DISCLAIMER,
  FLOAT_BUTTON_LABEL,
  PRIVACY_NOTE,
} from "../shared/constants";
import type { AppSettings } from "../shared/types";
import {
  getSettings,
  updateSettings,
} from "../shared/storage";
import { sendMessage } from "../shared/symbol-resolver";
import { applyThemeClass } from "../shared/theme";
import {
  exportData,
  validateImportPayload,
} from "../shared/export-import";
import { downloadJson } from "../shared/download";

function OptionsApp() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      applyThemeClass(document.body, s);
    });
  }, []);

  const patch = async (p: Partial<AppSettings>) => {
    const next = await updateSettings(p);
    setSettings(next);
    applyThemeClass(document.body, next);
  };

  const handleExport = async () => {
    const payload = await exportData(true);
    downloadJson(payload);
    setStatus("Backup exported.");
  };

  const handleImport = async (mode: "merge" | "replace") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text) as unknown;
        validateImportPayload(raw);
        if (
          mode === "replace" &&
          !confirm("Replace all local data with this backup?")
        ) {
          return;
        }
        await sendMessage({
          type: "IMPORT_DATA",
          payload: { payload: raw, mode },
        });
        setStatus(`Import ${mode} completed.`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Import failed.");
      }
    };
    input.click();
  };

  const clearTier = async (
    tier: "earnings" | "session" | "research" | "all",
  ) => {
    const labels = {
      earnings: "earnings cache",
      session: "session data",
      research: "all research data (watchlist + notes)",
      all: "ALL local data",
    };
    if (!confirm(`Clear ${labels[tier]}?`)) return;
    if (tier === "research" || tier === "all") {
      if (!confirm("Export a backup first is recommended. Continue?")) return;
    }
    await sendMessage({ type: "CLEAR_DATA", payload: { tier } });
    setStatus(`Cleared ${labels[tier]}.`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">{APP_NAME} Settings</h1>

      <section className="space-y-3 rounded border border-vv-border p-4">
        <h2 className="font-medium">Display</h2>
        <label className="block">
          <span className="text-vv-muted">Theme</span>
          <select
            className="mt-1 w-full rounded border border-vv-border bg-vv-bg p-2"
            value={settings.theme}
            onChange={(e) =>
              patch({
                theme: e.target.value as AppSettings["theme"],
              })
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.sidebarDefaultOpen}
            onChange={(e) => patch({ sidebarDefaultOpen: e.target.checked })}
          />
          Open sidebar automatically on supported stock pages
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.showFloatingButton}
            onChange={(e) => patch({ showFloatingButton: e.target.checked })}
          />
          Show floating [{FLOAT_BUTTON_LABEL}] launch button on supported pages
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.pageExtractionEnabled}
            onChange={(e) => patch({ pageExtractionEnabled: e.target.checked })}
          />
          Enable page metric extraction
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.tradingViewEmbedEnabled}
            onChange={(e) =>
              patch({ tradingViewEmbedEnabled: e.target.checked })
            }
          />
          Show TradingView embed in Chart tab (on by default)
        </label>
      </section>

      <section className="space-y-3 rounded border border-vv-border p-4">
        <h2 className="font-medium">Earnings cache</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.earningsCache.enabled}
            onChange={(e) =>
              patch({
                earningsCache: {
                  ...settings.earningsCache,
                  enabled: e.target.checked,
                },
              })
            }
          />
          Fetch earnings dates from Yahoo Finance (third-party)
        </label>
        <label className="block">
          Cache TTL (days)
          <input
            type="number"
            min={1}
            max={30}
            className="ml-2 w-20 rounded border border-vv-border bg-vv-bg p-1"
            value={settings.earningsCache.ttlDays}
            onChange={(e) =>
              patch({
                earningsCache: {
                  ...settings.earningsCache,
                  ttlDays: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.earningsCache.offlineMemoryEnabled}
            onChange={(e) =>
              patch({
                earningsCache: {
                  ...settings.earningsCache,
                  offlineMemoryEnabled: e.target.checked,
                },
              })
            }
          />
          Use offline earnings memory estimates when fetch unavailable
        </label>
        <p className="text-xs text-vv-muted">
          Earnings data may be fetched from unofficial Yahoo Finance endpoints.
          No account or backend login is required.
        </p>
      </section>

      <section className="space-y-2 rounded border border-vv-border p-4">
        <h2 className="font-medium">Backup</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded bg-vv-accent px-3 py-1.5 text-white"
            onClick={() => void handleExport()}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="rounded border border-vv-border px-3 py-1.5"
            onClick={() => void handleImport("merge")}
          >
            Import (merge)
          </button>
          <button
            type="button"
            className="rounded border border-vv-border px-3 py-1.5"
            onClick={() => void handleImport("replace")}
          >
            Import (replace all)
          </button>
        </div>
      </section>

      <section className="space-y-2 rounded border border-vv-border p-4">
        <h2 className="font-medium">Clear data</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-2 py-1" onClick={() => void clearTier("earnings")}>
            Clear earnings cache
          </button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => void clearTier("session")}>
            Clear session
          </button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => void clearTier("research")}>
            Clear research data
          </button>
          <button type="button" className="rounded border border-red-500 px-2 py-1 text-red-400" onClick={() => void clearTier("all")}>
            Clear all
          </button>
        </div>
      </section>

      <section className="space-y-2 text-sm text-vv-muted">
        <h2 className="font-medium text-vv-text">Privacy</h2>
        <p>{PRIVACY_NOTE}</p>
        <p>{DISCLAIMER}</p>
        <p>
          Chart embeds may use TradingView widgets. TradingView is a separate
          third-party service.
        </p>
      </section>

      {status ? <p className="text-sm text-vv-success">{status}</p> : null}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
);
