/// <reference types="vite/client" />

export type Market = "US" | "India-NSE" | "India-BSE" | "UK" | "Other";

export type SymbolSource =
  | "manual"
  | "watchlist"
  | "session"
  | "page-detected"
  | "none";

export type TabId =
  | "snapshot"
  | "valuation"
  | "quality"
  | "technical"
  | "events"
  | "thesis"
  | "watchlist"
  | "dashboard";

export type WatchlistStatus =
  | "Watching"
  | "Researching"
  | "Ready"
  | "Passed"
  | "Avoid";

export type SetupType =
  | "Breakout"
  | "Pullback"
  | "Range"
  | "Downtrend"
  | "Momentum"
  | "Avoid"
  | "Other"
  | "";

export type PageExtractionState =
  | "idle"
  | "running"
  | "success"
  | "failed"
  | "not-applicable";

export type EarningsCacheState =
  | "hit"
  | "miss"
  | "stale"
  | "fetching"
  | "offline-memory"
  | "unavailable";

export type SupportedSite =
  | "yahoo"
  | "nse"
  | "screener"
  | "sec"
  | "none";

export interface WatchlistEntry {
  symbol: string;
  companyName: string;
  market: Market;
  source: string;
  status: WatchlistStatus;
  tags: string[];
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisNotes {
  interest: string;
  bullCase: string;
  bearCase: string;
  buyTrigger: string;
  sellOrAvoidReason: string;
  disconfirmingEvidence: string;
}

export interface NotesEntry {
  valuationNote: string;
  qualityNote: string;
  technicalNote: string;
  eventNote: string;
  thesis: ThesisNotes;
  companyNameOverride?: string;
  setupType?: SetupType;
  trendNote?: string;
  entryWatchNote?: string;
  stopRiskNote?: string;
  timeframeNote?: string;
  nextEventToWatch?: string;
  reviewDate?: string;
  eventNoteManual?: string;
  resultExpectationNote?: string;
  followUpAction?: string;
}

export interface EarningsCacheEntry {
  symbol: string;
  nextEarningsDate: string | null;
  earningsTime: string | null;
  fiscalQuarterEnding: string | null;
  epsEstimate: string | null;
  source: string;
  fetchedAt: string;
  ttlDays: number;
}

export interface EarningsMemoryEntry {
  symbol: string;
  market: Market;
  typicalMonths: number[];
  typicalWeek: string;
  note: string;
}

export interface EarningsCacheSettings {
  enabled: boolean;
  ttlDays: number;
  autoFetchOnSidebarOpen: boolean;
  showStalenessWarning: boolean;
  stalenessWarningAfterDays: number;
  offlineMemoryEnabled: boolean;
}

export interface AppSettings {
  sidebarDefaultOpen: boolean;
  theme: "light" | "dark" | "system";
  showFloatingButton: boolean;
  pageExtractionEnabled: boolean;
  tradingViewEmbedEnabled: boolean;
  earningsCache: EarningsCacheSettings;
}

export interface SessionState {
  activeSymbol: string | null;
  activeMarket: Market | null;
  recentSymbols: Array<{ symbol: string; market: Market }>;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeTab: TabId;
}

export interface StorageData {
  schemaVersion: string;
  watchlist: Record<string, WatchlistEntry>;
  notes: Record<string, NotesEntry>;
  earningsCache: Record<string, EarningsCacheEntry>;
  settings: AppSettings;
  sessionState: SessionState;
}

export interface DetectedPageContext {
  site: SupportedSite;
  symbol: string | null;
  companyName: string | null;
  market: Market | null;
  pageType: string;
  url: string;
  title: string;
}

export interface ExtractedMetrics {
  price: string | null;
  changePercent: string | null;
  marketCap: string | null;
  pe: string | null;
  dividendYield: string | null;
  week52Range: string | null;
  roe: string | null;
  roce: string | null;
  debtEquity: string | null;
  promoterHolding: string | null;
  earningsDate: string | null;
  dividendDate: string | null;
  filingDate: string | null;
  source: string;
}

export interface SidebarState {
  activeSymbol: string | null;
  activeMarket: Market | null;
  symbolSource: SymbolSource;
  pageContextAvailable: boolean;
  pageExtractionState: PageExtractionState;
  localDataLoaded: boolean;
  earningsCacheState: EarningsCacheState;
  activeTab: TabId;
  collapsed: boolean;
  open: boolean;
  extracted: ExtractedMetrics | null;
  detectedContext: DetectedPageContext | null;
  companyName: string;
}

export interface ExportPayload {
  app: string;
  appVersion: string;
  schemaVersion: string;
  exportedAt: string;
  watchlist: Record<string, WatchlistEntry>;
  notes: Record<string, NotesEntry>;
  earningsCache: Record<string, EarningsCacheEntry>;
  settings?: AppSettings;
}

export type MessageType =
  | "GET_STORAGE"
  | "SET_STORAGE"
  | "LOAD_SYMBOL"
  | "OPEN_SIDEBAR"
  | "TOGGLE_SIDEBAR"
  | "GET_PAGE_CONTEXT"
  | "EXTRACTION_RESULT"
  | "FETCH_EARNINGS"
  | "EARNINGS_RESULT"
  | "FETCH_METRICS"
  | "EXPORT_DATA"
  | "IMPORT_DATA"
  | "CLEAR_DATA"
  | "PING"
  | "OPEN_SIDE_PANEL"
  | "OPEN_SIDE_PANEL_LOAD"
  | "SET_PAGE_CONTEXT_SESSION";

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}
