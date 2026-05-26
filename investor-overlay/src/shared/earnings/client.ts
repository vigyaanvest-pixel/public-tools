import type { Market } from "../types";
import { sendMessage } from "../symbol-resolver";

export async function fetchEarningsViaBackground(
  symbol: string,
  market: Market,
  pageEarnings: string | null,
): Promise<{ date: string | null; sourceLabel: string; stale: boolean }> {
  const result = await sendMessage<{
    date: string | null;
    sourceLabel: string;
    stale: boolean;
  }>({
    type: "FETCH_EARNINGS",
    payload: { symbol, market, pageEarnings },
  });
  return result ?? { date: null, sourceLabel: "unavailable", stale: false };
}
