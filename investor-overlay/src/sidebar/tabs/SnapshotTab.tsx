import { useState } from "react";
import { useApp } from "../context/AppContext";
import { MetricCard } from "../components/MetricCard";
import { buildQuickLinks } from "../../shared/source-links";
import {
  COUNTRY_BY_MARKET,
  CURRENCY_BY_MARKET,
  PERFORMANCE_AVG_RETURN_PER_WIN_URL,
  MARKET_LABELS,
  PERFORMANCE_DASHBOARD_URL,
  PERFORMANCE_SUCCESS_RATE_URL,
  VIGYAANVEST_URL,
} from "../../shared/constants";
import { hasMetricValues } from "../../shared/metrics/select";

const VIGYAANVEST_PERFORMANCE_METRICS = [
  {
    label: "Success Rate (%)",
    value: "87.7%",
    href: PERFORMANCE_SUCCESS_RATE_URL,
  },
  {
    label: "Avg. Return per Win",
    value: "16.44%",
    href: PERFORMANCE_AVG_RETURN_PER_WIN_URL,
  },
  {
    label: "Avg. Holding Days per Win",
    value: "15.19",
    href: PERFORMANCE_DASHBOARD_URL,
  },
  {
    label: "Alerts (Closed)",
    value: "358.0",
    href: PERFORMANCE_DASHBOARD_URL,
  },
  {
    label: "Best Trade (%)",
    value: "177.58%",
    href: PERFORMANCE_DASHBOARD_URL,
  },
  {
    label: "Normalized Monthly Return (%)",
    value: "32.47%",
    href: PERFORMANCE_DASHBOARD_URL,
  },
];

export function SnapshotTab() {
  const app = useApp();
  const [showVigyaanVestMetrics, setShowVigyaanVestMetrics] = useState(false);
  const { symbol, market, companyName, extracted, detectedContext, apiMetrics } = app;

  if (!symbol || !market) {
    return (
      <p className="text-sm text-vv-muted">
        Enter a symbol above to start researching.
      </p>
    );
  }

  const pageMatch =
    detectedContext?.symbol?.toUpperCase() === symbol.toUpperCase() &&
    detectedContext?.site !== "none";

  // Prefer live page-extracted data; fall back to background API fetch
  const live = pageMatch && hasMetricValues(extracted, ["price", "changePercent", "marketCap", "week52Range"])
    ? extracted
    : null;
  const metrics = live ?? apiMetrics;
  const metricsSource = live ? detectedContext?.site : (apiMetrics?.source ?? null);
  const links = buildQuickLinks(symbol, market);

  return (
    <div>
      {/* Identity grid */}
      <div className="section-hdr" style={{ marginBottom: 10 }}>Identity</div>
      <div className="metric-grid">
        <MetricCard label="Symbol" value={symbol} />
        <MetricCard label="Market" value={MARKET_LABELS[market]} />
        <MetricCard label="Country" value={COUNTRY_BY_MARKET[market]} />
        <MetricCard label="Currency" value={CURRENCY_BY_MARKET[market]} />
        <div className="metric-card" style={{ gridColumn: "span 2" }}>
          <div className="metric-label">Company</div>
          <input
            className="metric-value"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              width: "100%",
              padding: 0,
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: companyName ? "var(--vv-text)" : "var(--vv-text3)",
            }}
            value={companyName}
            onChange={(e) => app.setCompanyName(e.target.value)}
            onBlur={() => void app.saveCompanyName()}
            placeholder="—"
            title="Edit company name"
          />
        </div>
      </div>

      {/* Live market data */}
      <div className="section-hdr" style={{ marginBottom: 10 }}>
        <span>Market data</span>
        {metricsSource ? (
          <span style={{ color: "var(--vv-accent)", textTransform: "none", letterSpacing: 0, fontSize: 9 }}>
            ↑ {metricsSource}
          </span>
        ) : (
          <span style={{ textTransform: "none", letterSpacing: 0, fontSize: 9 }}>
            loading…
          </span>
        )}
      </div>
      <div className="metric-grid">
        <MetricCard label="Price" value={metrics?.price ?? null} positive={!!metrics?.price} />
        <MetricCard
          label="Today %"
          value={metrics?.changePercent ?? null}
          positive={Boolean(metrics?.changePercent?.startsWith("+"))}
        />
        <MetricCard label="Market Cap" value={metrics?.marketCap ?? null} />
        <MetricCard label="52-Wk Range" value={metrics?.week52Range ?? null} />
      </div>

      {/* Quick links */}
      <div className="section-hdr" style={{ marginBottom: 8, marginTop: 4 }}>Quick links</div>
      <div className="link-chips">
        {links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="link-chip"
          >
            ↗ {l.label}
          </a>
        ))}
      </div>

      <section className="vv-brand-panel">
        <div className="vv-brand-row">
          <div>
            <div className="vv-powered">Powered by</div>
            <a
              className="vv-brand-link"
              href={VIGYAANVEST_URL}
              target="_blank"
              rel="noreferrer"
            >
              VigyaanVest.com
            </a>
          </div>
          <button
            type="button"
            className="vv-text-btn"
            onClick={() => setShowVigyaanVestMetrics((v) => !v)}
          >
            {showVigyaanVestMetrics ? "Hide" : "Know more"}
          </button>
        </div>
        <p className="vv-brand-copy">
          AI stock signals with transparent tracking and a public performance dashboard.
        </p>

        {showVigyaanVestMetrics ? (
          <div className="vv-performance-panel">
            <div className="vv-performance-grid">
              {VIGYAANVEST_PERFORMANCE_METRICS.map((metric) => (
                <a
                  key={metric.label}
                  className="vv-performance-card"
                  href={metric.href}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open ${metric.label} in the VigyaanVest performance dashboard`}
                >
                  <span className="vv-performance-label">{metric.label}</span>
                  <span className="vv-performance-value">{metric.value}</span>
                </a>
              ))}
            </div>
            <p className="vv-brand-copy">
              Closed-trades summary. Tap a metric to inspect it in the public dashboard; full drill-downs are available there.
            </p>
            <a
              className="btn-secondary vv-detail-link"
              href={PERFORMANCE_DASHBOARD_URL}
              target="_blank"
              rel="noreferrer"
            >
              Show details
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}
