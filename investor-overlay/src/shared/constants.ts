import type { AppSettings, Market, NotesEntry, TabId } from "./types";

export const SCHEMA_VERSION = "0.2.1";
export const APP_NAME = "Symbol 360";
export const APP_TAGLINE =
  "Full-circle symbol research in your browser sidebar.";
export const APP_VERSION = "0.1.1";
export const FLOAT_BUTTON_LABEL = "S";
export const MAX_RECENT_SYMBOLS = 10;
export const RECENT_DISPLAY_COUNT = 3;
export const MAX_SYMBOL_LENGTH = 12;
export const VIGYAANVEST_URL = "https://vigyaanvest.com";
export const PERFORMANCE_DASHBOARD_URL =
  "https://datastudio.google.com/u/0/reporting/73029b9f-3274-4447-b49a-a0654a881d96/page/kIV1C";
export const PERFORMANCE_SUCCESS_RATE_URL =
  "https://datastudio.google.com/s/vmGtN05jXVs#cd-fz9gvyz7sd";
export const PERFORMANCE_AVG_RETURN_PER_WIN_URL =
  "https://datastudio.google.com/s/jsRpNlQ1ZVA#cd-djufs82lvd";

export const MARKETS: Market[] = [
  "US",
  "India-NSE",
  "India-BSE",
];

export const MARKET_LABELS: Record<Market, string> = {
  US: "US",
  "India-NSE": "India (NSE)",
  "India-BSE": "India (BSE)",
  UK: "UK",
  Other: "Other",
};

export const TAB_LABELS: Record<TabId, string> = {
  snapshot: "Snapshot",
  valuation: "Valuation",
  quality: "Quality",
  technical: "Chart",
  events: "Events",
  thesis: "Thesis",
  watchlist: "Watchlist",
  dashboard: "Dashboard",
};

export const TAB_ORDER: TabId[] = [
  "snapshot",
  "valuation",
  "quality",
  "technical",
  "events",
  "thesis",
  "watchlist",
  "dashboard",
];

export const WATCHLIST_STATUSES = [
  "Watching",
  "Researching",
  "Ready",
  "Passed",
  "Avoid",
] as const;

export const SETUP_TYPES = [
  "Breakout",
  "Pullback",
  "Range",
  "Downtrend",
  "Momentum",
  "Avoid",
  "Other",
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  sidebarDefaultOpen: false,
  theme: "dark",
  showFloatingButton: true,
  pageExtractionEnabled: true,
  tradingViewEmbedEnabled: true,
  earningsCache: {
    enabled: true,
    ttlDays: 7,
    autoFetchOnSidebarOpen: true,
    showStalenessWarning: true,
    stalenessWarningAfterDays: 5,
    offlineMemoryEnabled: true,
  },
};

export const DEFAULT_NOTES: NotesEntry = {
  valuationNote: "",
  qualityNote: "",
  technicalNote: "",
  eventNote: "",
  thesis: {
    interest: "",
    bullCase: "",
    bearCase: "",
    buyTrigger: "",
    sellOrAvoidReason: "",
    disconfirmingEvidence: "",
  },
  setupType: "",
  trendNote: "",
  entryWatchNote: "",
  stopRiskNote: "",
  timeframeNote: "",
  nextEventToWatch: "",
  reviewDate: "",
  eventNoteManual: "",
  resultExpectationNote: "",
  followUpAction: "",
};

export const CURRENCY_BY_MARKET: Record<Market, string> = {
  US: "USD",
  "India-NSE": "INR",
  "India-BSE": "INR",
  UK: "GBP",
  Other: "—",
};

export const COUNTRY_BY_MARKET: Record<Market, string> = {
  US: "United States",
  "India-NSE": "India",
  "India-BSE": "India",
  UK: "United Kingdom",
  Other: "—",
};

export const DISCLAIMER =
  "This extension is a research organization tool only. It does not provide investment advice, recommendations, or portfolio management.";

export const PRIVACY_NOTE =
  "Data saved only in this browser. Notes and watchlists never leave your device.";
