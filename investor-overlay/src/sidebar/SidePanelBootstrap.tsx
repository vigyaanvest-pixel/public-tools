import { useEffect, useRef } from "react";
import { useApp } from "./context/AppContext";
import type { DetectedPageContext, ExtractedMetrics, Market, TabId } from "../shared/types";
import {
  PAGE_CONTEXT_SESSION_KEY,
  PENDING_SIDEBAR_LOAD_KEY,
} from "../shared/side-panel";

interface PendingLoad {
  symbol: string;
  market: Market;
  tab?: TabId;
  ts?: number;
}

interface PageContextPayload {
  ctx: DetectedPageContext;
  extracted: ExtractedMetrics | null;
}

export function SidePanelBootstrap() {
  const app = useApp();
  // Keep a stable ref to the latest app so the effect and listener always
  // call current functions without needing to re-register on every render.
  const appRef = useRef(app);
  appRef.current = app;

  useEffect(() => {
    async function consumePendingLoad(pendingLoad: PendingLoad | undefined) {
      if (!pendingLoad?.symbol) return;
      if (pendingLoad.ts && Date.now() - pendingLoad.ts > 30000) {
        await chrome.storage.session.remove(PENDING_SIDEBAR_LOAD_KEY);
        return;
      }
      await chrome.storage.session.remove(PENDING_SIDEBAR_LOAD_KEY);
      await appRef.current.loadSymbol(
        pendingLoad.symbol,
        pendingLoad.market,
        "manual",
        pendingLoad.tab,
      );
      appRef.current.openSidebar();
    }

    void (async () => {
      const session = await chrome.storage.session.get([
        PENDING_SIDEBAR_LOAD_KEY,
        PAGE_CONTEXT_SESSION_KEY,
      ]);
      const pageCtx = session[PAGE_CONTEXT_SESSION_KEY] as
        | PageContextPayload
        | undefined;
      if (pageCtx?.ctx) {
        appRef.current.setPageContext(pageCtx.ctx, pageCtx.extracted ?? null);
      }
      await consumePendingLoad(
        session[PENDING_SIDEBAR_LOAD_KEY] as PendingLoad | undefined,
      );
    })();

    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "session") return;

      if (changes[PAGE_CONTEXT_SESSION_KEY]?.newValue) {
        const next = changes[PAGE_CONTEXT_SESSION_KEY].newValue as PageContextPayload;
        appRef.current.setPageContext(next.ctx, next.extracted ?? null);
      }

      if (changes[PENDING_SIDEBAR_LOAD_KEY]?.newValue) {
        void consumePendingLoad(
          changes[PENDING_SIDEBAR_LOAD_KEY].newValue as PendingLoad,
        );
      }
    };

    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []); // run once on mount — appRef.current always has the latest functions

  return null;
}
