import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  DetectedPageContext,
  ExtractedMetrics,
  Market,
  NotesEntry,
  SymbolSource,
  TabId,
  WatchlistEntry,
} from "../../shared/types";
import {
  addRecentSymbol,
  getNotes,
  getSettings,
  getStorage,
  getWatchlistEntry,
  saveNotes,
  updateSessionState,
  upsertWatchlistEntry,
} from "../../shared/storage";
import { flushPendingPageContext } from "../../content/page-context-bridge";
import { markSidebarBridgeReady } from "../../content/sidebar-command-queue";
import { fetchEarningsViaBackground } from "../../shared/earnings/client";
import { fetchMetricsViaBackground } from "../../shared/metrics/client";
import { DEFAULT_NOTES } from "../../shared/constants";
import { nowIso } from "../../shared/format";

export interface AppContextValue {
  symbol: string | null;
  market: Market | null;
  symbolSource: SymbolSource;
  activeTab: TabId;
  collapsed: boolean;
  open: boolean;
  notes: NotesEntry;
  watchlistEntry: WatchlistEntry | null;
  extracted: ExtractedMetrics | null;
  detectedContext: DetectedPageContext | null;
  companyName: string;
  earningsDate: string | null;
  earningsSourceLabel: string;
  earningsStale: boolean;
  allWatchlist: WatchlistEntry[];
  apiMetrics: ExtractedMetrics | null;
  setCompanyName: (name: string) => void;
  saveCompanyName: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  loadSymbol: (
    symbol: string,
    market: Market,
    source: SymbolSource,
    tab?: TabId,
  ) => Promise<void>;
  setNotes: (notes: NotesEntry) => void;
  saveNotesNow: () => Promise<void>;
  addToWatchlist: () => Promise<void>;
  updateWatchlistEntry: (entry: WatchlistEntry) => Promise<void>;
  removeFromWatchlist: () => Promise<void>;
  toggle: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setCollapsed: (v: boolean) => void;
  setPageContext: (
    ctx: DetectedPageContext,
    extracted: ExtractedMetrics | null,
  ) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}

export function AppProvider({
  children,
  surface = "overlay",
}: {
  children: ReactNode;
  surface?: "overlay" | "sidepanel";
}) {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [symbolSource, setSymbolSource] = useState<SymbolSource>("none");
  const [activeTab, setActiveTab] = useState<TabId>("snapshot");
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(surface === "sidepanel");
  const [notes, setNotesState] = useState<NotesEntry>({
    ...DEFAULT_NOTES,
    thesis: { ...DEFAULT_NOTES.thesis },
  });
  const [watchlistEntry, setWatchlistEntry] = useState<WatchlistEntry | null>(
    null,
  );
  const [extracted, setExtracted] = useState<ExtractedMetrics | null>(null);
  const [detectedContext, setDetectedContext] =
    useState<DetectedPageContext | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [earningsDate, setEarningsDate] = useState<string | null>(null);
  const [earningsSourceLabel, setEarningsSourceLabel] = useState("");
  const [earningsStale, setEarningsStale] = useState(false);
  const [allWatchlist, setAllWatchlist] = useState<WatchlistEntry[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ExtractedMetrics | null>(null);

  const refreshWatchlistAll = useCallback(async () => {
    const data = await getStorage();
    setAllWatchlist(Object.values(data.watchlist));
  }, []);

  // Refs so loadSymbol can read the latest values without being in its dep array.
  // This prevents the init useEffect from re-firing every time page context arrives.
  const activeTabRef = useRef<TabId>("snapshot");
  const detectedContextRef = useRef<DetectedPageContext | null>(null);
  const extractedRef = useRef<ExtractedMetrics | null>(null);
  activeTabRef.current = activeTab;
  detectedContextRef.current = detectedContext;
  extractedRef.current = extracted;

  const loadSymbol = useCallback(
    async (
      sym: string,
      mkt: Market,
      source: SymbolSource,
      tab?: TabId,
    ) => {
      const s = sym.toUpperCase();
      setSymbol(s);
      setMarket(mkt);
      setSymbolSource(source);
      setApiMetrics(null);
      if (tab) setActiveTab(tab);
      setOpen(true);
      setCollapsed(false);

      const [n, wl] = await Promise.all([
        getNotes(s, mkt),
        getWatchlistEntry(s, mkt),
      ]);
      setNotesState(n);
      setWatchlistEntry(wl);
      setCompanyName(
        wl?.companyName ??
          n.companyNameOverride ??
          detectedContextRef.current?.companyName ??
          "",
      );
      await addRecentSymbol(s, mkt);
      await updateSessionState({
        activeSymbol: s,
        activeMarket: mkt,
        sidebarOpen: true,
        sidebarCollapsed: false,
        activeTab: tab ?? activeTabRef.current,
      });
      await refreshWatchlistAll();

      const pageEarnings =
        extractedRef.current &&
        detectedContextRef.current?.symbol?.toUpperCase() === s &&
        extractedRef.current.earningsDate
          ? extractedRef.current.earningsDate
          : null;
      const [earnings, apiResult] = await Promise.all([
        fetchEarningsViaBackground(s, mkt, pageEarnings),
        fetchMetricsViaBackground(s, mkt),
      ]);
      const metricsEarningsDate = apiResult?.metrics?.earningsDate ?? null;
      const resolvedEarningsDate = earnings.date ?? metricsEarningsDate;
      setEarningsDate(resolvedEarningsDate);
      setEarningsSourceLabel(
        earnings.date
          ? earnings.sourceLabel
          : metricsEarningsDate
            ? `${apiResult?.metrics?.source ?? "market data"} earnings`
            : earnings.sourceLabel,
      );
      setEarningsStale(earnings.date ? earnings.stale : false);
      setApiMetrics(apiResult?.metrics ?? null);
      // Fill company name from API if not already known
      if (apiResult?.companyName && !wl?.companyName && !n.companyNameOverride) {
        setCompanyName(apiResult.companyName);
      }
    },
    [refreshWatchlistAll], // stable — volatile values accessed via refs above
  );

  // Run once on mount. loadSymbol is now stable so this won't re-fire.
  useEffect(() => {
    (async () => {
      const data = await getStorage();
      setAllWatchlist(Object.values(data.watchlist));
      const { sessionState } = data;
      if (sessionState.activeSymbol && sessionState.activeMarket) {
        await loadSymbol(
          sessionState.activeSymbol,
          sessionState.activeMarket,
          "session",
          sessionState.activeTab,
        );
        if (surface === "overlay") {
          setOpen(sessionState.sidebarOpen);
          setCollapsed(sessionState.sidebarCollapsed);
        }
      }
    })();
  }, [loadSymbol, surface]);

  const setNotes = (n: NotesEntry) => setNotesState(n);

  const saveNotesNow = async () => {
    if (!symbol || !market) return;
    await saveNotes(symbol, market, notes);
    if (watchlistEntry && notes.reviewDate !== watchlistEntry.reviewDate) {
      await upsertWatchlistEntry({
        ...watchlistEntry,
        reviewDate: notes.reviewDate ?? "",
        updatedAt: nowIso(),
      });
      await refreshWatchlistAll();
    }
  };

  const saveCompanyName = async () => {
    if (!symbol || !market) return;
    const nextNotes = { ...notes, companyNameOverride: companyName };
    setNotesState(nextNotes);
    await saveNotes(symbol, market, nextNotes);
    if (watchlistEntry) {
      const updated = {
        ...watchlistEntry,
        companyName: companyName || symbol,
        updatedAt: nowIso(),
      };
      await upsertWatchlistEntry(updated);
      setWatchlistEntry(updated);
      await refreshWatchlistAll();
    }
  };

  const addToWatchlist = async () => {
    if (!symbol || !market) return;
    const entry: WatchlistEntry = {
      symbol,
      companyName: companyName || symbol,
      market,
      source: detectedContext?.site ?? "manual",
      status: "Watching",
      tags: [],
      reviewDate: notes.reviewDate ?? "",
      createdAt: watchlistEntry?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };
    await upsertWatchlistEntry(entry);
    setWatchlistEntry(entry);
    await refreshWatchlistAll();
  };

  const updateWatchlistEntryFn = async (entry: WatchlistEntry) => {
    await upsertWatchlistEntry(entry);
    setWatchlistEntry(entry);
    await refreshWatchlistAll();
  };

  const removeFromWatchlist = async () => {
    if (!symbol || !market) return;
    const { removeWatchlistEntry } = await import("../../shared/storage");
    await removeWatchlistEntry(symbol, market);
    setWatchlistEntry(null);
    await refreshWatchlistAll();
  };

  const setPageContext = (
    ctx: DetectedPageContext,
    ext: ExtractedMetrics | null,
  ) => {
    setDetectedContext(ctx);
    setExtracted(ext);
    if (
      ctx.symbol &&
      symbol &&
      ctx.symbol.toUpperCase() === symbol.toUpperCase()
    ) {
      if (ctx.companyName) setCompanyName(ctx.companyName);
    }
  };

  const value = useMemo<AppContextValue>(
    () => ({
      symbol,
      market,
      symbolSource,
      activeTab,
      collapsed,
      open,
      notes,
      watchlistEntry,
      extracted,
      detectedContext,
      companyName,
      earningsDate,
      earningsSourceLabel,
      earningsStale,
      allWatchlist,
      apiMetrics,
      setActiveTab: async (tab) => {
        setActiveTab(tab);
        await updateSessionState({ activeTab: tab });
      },
      loadSymbol,
      setNotes,
      saveNotesNow,
      saveCompanyName,
      setCompanyName,
      addToWatchlist,
      updateWatchlistEntry: updateWatchlistEntryFn,
      removeFromWatchlist,
      toggle: () => {
        setOpen((o) => {
          const next = !o;
          updateSessionState({ sidebarOpen: next });
          return next;
        });
      },
      openSidebar: () => {
        setOpen(true);
        updateSessionState({ sidebarOpen: true });
      },
      closeSidebar: () => {
        setOpen(false);
        updateSessionState({ sidebarOpen: false });
      },
      setCollapsed: (v) => {
        setCollapsed(v);
        updateSessionState({ sidebarCollapsed: v });
      },
      setPageContext,
    }),
    [
      symbol,
      market,
      symbolSource,
      activeTab,
      collapsed,
      open,
      notes,
      watchlistEntry,
      extracted,
      detectedContext,
      companyName,
      earningsDate,
      earningsSourceLabel,
      earningsStale,
      allWatchlist,
      apiMetrics,
      loadSymbol,
      saveCompanyName,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const sidebarController = {
  loadSymbol: null as
    | ((
        symbol: string,
        market: Market,
        source: SymbolSource,
        tab?: TabId,
      ) => void)
    | null,
  toggle: () => {},
  open: () => {},
  setPageContext: null as
    | ((
        ctx: DetectedPageContext,
        extracted: ExtractedMetrics | null,
      ) => void)
    | null,
};

export function SidebarBridge() {
  const app = useApp();
  useEffect(() => {
    sidebarController.loadSymbol = (s, m, src, tab) => {
      void app.loadSymbol(s, m, src, tab);
    };
    sidebarController.toggle = app.toggle;
    sidebarController.open = app.openSidebar;
    sidebarController.setPageContext = app.setPageContext;
    flushPendingPageContext();
    markSidebarBridgeReady();
  }, [app]);
  return null;
}
