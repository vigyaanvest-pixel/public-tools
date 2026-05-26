import type { ExtractedMetrics } from "../types";

type MetricField = Exclude<keyof ExtractedMetrics, "source">;

export function hasMetricValues(
  metrics: ExtractedMetrics | null,
  fields: MetricField[],
): metrics is ExtractedMetrics {
  return Boolean(metrics && fields.some((field) => Boolean(metrics[field])));
}
