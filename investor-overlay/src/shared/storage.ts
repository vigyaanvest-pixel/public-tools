import {
  DEFAULT_NOTES,
  DEFAULT_SETTINGS,
  SCHEMA_VERSION,
} from "./constants";
import type {
  AppSettings,
  Market,
  NotesEntry,
  SessionState,
  StorageData,
  WatchlistEntry,
} from "./types";
import { normalizeSymbol, nowIso, storageKey } from "./format";

const DEFAULT_SESSION: SessionState = {
  activeSymbol: null,
  activeMarket: null,
  recentSymbols: [],
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeTab: "snapshot",
};

export function createDefaultStorage(): StorageData {
  return {
    schemaVersion: SCHEMA_VERSION,
    watchlist: {},
    notes: {},
    earningsCache: {},
    settings: { ...DEFAULT_SETTINGS },
    sessionState: { ...DEFAULT_SESSION },
  };
}

export async function getStorage(): Promise<StorageData> {
  const result = await chrome.storage.local.get(null);
  if (!result.schemaVersion) {
    const defaults = createDefaultStorage();
    await chrome.storage.local.set(defaults);
    return defaults;
  }
  const needsTradingViewDefaultMigration = result.schemaVersion !== SCHEMA_VERSION;
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(result.settings as AppSettings),
    ...(needsTradingViewDefaultMigration ? { tradingViewEmbedEnabled: true } : {}),
  };
  const storage = {
    ...createDefaultStorage(),
    ...result,
    schemaVersion: SCHEMA_VERSION,
    settings,
    sessionState: {
      ...DEFAULT_SESSION,
      ...(result.sessionState as SessionState),
    },
  } as StorageData;

  if (result.schemaVersion !== SCHEMA_VERSION || needsTradingViewDefaultMigration) {
    await chrome.storage.local.set({
      schemaVersion: storage.schemaVersion,
      settings: storage.settings,
    });
  }

  return {
    ...storage,
  };
}

export async function setStorage(partial: Partial<StorageData>): Promise<void> {
  await chrome.storage.local.set(partial);
}

export async function getSettings(): Promise<AppSettings> {
  const data = await getStorage();
  return data.settings;
}

export async function updateSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const data = await getStorage();
  const settings = { ...data.settings, ...patch };
  await setStorage({ settings });
  return settings;
}

export async function getSessionState(): Promise<SessionState> {
  const data = await getStorage();
  return data.sessionState;
}

export async function updateSessionState(
  patch: Partial<SessionState>,
): Promise<SessionState> {
  const data = await getStorage();
  const sessionState = { ...data.sessionState, ...patch };
  await setStorage({ sessionState });
  return sessionState;
}

export async function getWatchlistEntry(
  symbol: string,
  market: string,
): Promise<WatchlistEntry | null> {
  const data = await getStorage();
  return data.watchlist[storageKey(symbol, market)] ?? null;
}

export async function upsertWatchlistEntry(
  entry: WatchlistEntry,
): Promise<void> {
  const data = await getStorage();
  const key = storageKey(entry.symbol, entry.market);
  data.watchlist[key] = { ...entry, updatedAt: nowIso() };
  await setStorage({ watchlist: data.watchlist });
}

export async function removeWatchlistEntry(
  symbol: string,
  market: string,
): Promise<void> {
  const data = await getStorage();
  const key = storageKey(symbol, market);
  delete data.watchlist[key];
  await setStorage({ watchlist: data.watchlist });
}

export async function getNotes(
  symbol: string,
  market: string,
): Promise<NotesEntry> {
  const data = await getStorage();
  const key = storageKey(symbol, market);
  return data.notes[key] ?? { ...DEFAULT_NOTES, thesis: { ...DEFAULT_NOTES.thesis } };
}

export async function saveNotes(
  symbol: string,
  market: string,
  notes: NotesEntry,
): Promise<void> {
  const data = await getStorage();
  const key = storageKey(symbol, market);
  data.notes[key] = notes;
  await setStorage({ notes: data.notes });
}

export async function addRecentSymbol(
  symbol: string,
  market: Market,
): Promise<void> {
  const data = await getStorage();
  const sym = normalizeSymbol(symbol);
  const filtered = data.sessionState.recentSymbols.filter(
    (r) => !(r.symbol === sym && r.market === market),
  );
  filtered.unshift({ symbol: sym, market });
  await updateSessionState({
    recentSymbols: filtered.slice(0, 10),
  });
}

export async function clearEarningsCache(): Promise<void> {
  await setStorage({ earningsCache: {} });
}

export async function clearResearchData(): Promise<void> {
  await setStorage({ watchlist: {}, notes: {} });
}

export async function clearSessionData(): Promise<void> {
  await setStorage({ sessionState: { ...DEFAULT_SESSION } });
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
  const defaults = createDefaultStorage();
  await chrome.storage.local.set(defaults);
}
