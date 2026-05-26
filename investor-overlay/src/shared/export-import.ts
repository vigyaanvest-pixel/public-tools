import { APP_NAME, APP_VERSION, SCHEMA_VERSION } from "./constants";
import { createDefaultStorage, getStorage, setStorage } from "./storage";
import type { ExportPayload, StorageData } from "./types";
import { nowIso } from "./format";

export async function exportData(
  includeSettings = true,
): Promise<ExportPayload> {
  const data = await getStorage();
  return {
    app: APP_NAME,
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    watchlist: data.watchlist,
    notes: data.notes,
    earningsCache: data.earningsCache,
    settings: includeSettings ? data.settings : undefined,
  };
}

export function validateImportPayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid backup file: not a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version: ${String(obj.schemaVersion)}. Expected ${SCHEMA_VERSION}.`,
    );
  }
  if (!obj.watchlist || !obj.notes) {
    throw new Error("Invalid backup file: missing watchlist or notes.");
  }
  return obj as unknown as ExportPayload;
}

export async function importDataMerge(payload: ExportPayload): Promise<void> {
  const data = await getStorage();
  await setStorage({
    watchlist: { ...data.watchlist, ...payload.watchlist },
    notes: { ...data.notes, ...payload.notes },
    earningsCache: {
      ...data.earningsCache,
      ...(payload.earningsCache ?? {}),
    },
    settings: payload.settings
      ? { ...data.settings, ...payload.settings }
      : data.settings,
  });
}

export async function importDataReplace(payload: ExportPayload): Promise<void> {
  const base = createDefaultStorage();
  const merged: StorageData = {
    ...base,
    watchlist: payload.watchlist,
    notes: payload.notes,
    earningsCache: payload.earningsCache ?? {},
    settings: payload.settings ?? base.settings,
  };
  await setStorage(merged);
}
