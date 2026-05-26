import type { ExtractedMetrics, Market } from "../types";
import { sendMessage } from "../symbol-resolver";

export interface FetchMetricsResponse {
  metrics: ExtractedMetrics;
  companyName: string | null;
}

export async function fetchMetricsViaBackground(
  symbol: string,
  market: Market,
): Promise<FetchMetricsResponse | null> {
  try {
    const result = await sendMessage<FetchMetricsResponse | null>({
      type: "FETCH_METRICS",
      payload: { symbol, market },
    });
    return result ?? null;
  } catch {
    return null;
  }
}
