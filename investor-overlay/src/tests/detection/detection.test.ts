import { describe, expect, it } from "vitest";
import {
  detectPageContext,
  detectYahoo,
  detectScreener,
  detectNse,
  detectSec,
} from "../../content/detectors";

describe("page detection", () => {
  it("detects Yahoo Finance symbol from URL", () => {
    const ctx = detectYahoo("https://finance.yahoo.com/quote/AAPL/");
    expect(ctx?.symbol).toBe("AAPL");
    expect(ctx?.site).toBe("yahoo");
  });

  it("detects Screener.in symbol from URL", () => {
    const ctx = detectScreener("https://www.screener.in/company/RELIANCE/");
    expect(ctx?.symbol).toBe("RELIANCE");
    expect(ctx?.market).toBe("India-NSE");
  });

  it("detects NSE symbol from query param", () => {
    const ctx = detectNse(
      "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK",
    );
    expect(ctx?.symbol).toBe("HDFCBANK");
  });

  it("detects SEC CIK from URL", () => {
    const ctx = detectSec(
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=AAPL",
    );
    expect(ctx?.symbol).toBe("AAPL");
  });

  it("returns none site for unsupported URL", () => {
    const ctx = detectPageContext("https://example.com/");
    expect(ctx.site).toBe("none");
    expect(ctx.symbol).toBeNull();
  });
});

describe("storage key", () => {
  it("normalizes symbols", async () => {
    const { normalizeSymbol, storageKey } = await import("../../shared/format");
    expect(normalizeSymbol(" aapl ")).toBe("AAPL");
    expect(storageKey("AAPL", "US")).toBe("AAPL::US");
  });
});

describe("export validation", () => {
  it("rejects invalid import payload", async () => {
    const { validateImportPayload } = await import("../../shared/export-import");
    expect(() => validateImportPayload(null)).toThrow();
    expect(() => validateImportPayload({ schemaVersion: "0.0.0" })).toThrow();
  });
});
