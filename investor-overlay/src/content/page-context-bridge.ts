import type {
  DetectedPageContext,
  ExtractedMetrics,
} from "../shared/types";
import { sidebarController } from "../sidebar/context/AppContext";

let pendingPageContext: {
  ctx: DetectedPageContext;
  extracted: ExtractedMetrics | null;
} | null = null;

export function setPendingPageContext(
  ctx: DetectedPageContext,
  extracted: ExtractedMetrics | null,
): void {
  pendingPageContext = { ctx, extracted };
  sidebarController.setPageContext?.(ctx, extracted);
  chrome.runtime.sendMessage({
    type: "SET_PAGE_CONTEXT_SESSION",
    payload: { ctx, extracted },
  });
}

export function flushPendingPageContext(): void {
  if (!pendingPageContext || !sidebarController.setPageContext) return;
  sidebarController.setPageContext(
    pendingPageContext.ctx,
    pendingPageContext.extracted,
  );
}
