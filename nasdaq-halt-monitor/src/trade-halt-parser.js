(function attachNasdaqHaltParser(root) {
  const DEFAULT_REASON_CODES = ["LUDP", "LUDS", "T1", "T2"];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function todayNasdaqDate(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}/${date.getFullYear()}`;
  }

  function findHeaderIndex(headers, patterns, fallback) {
    const index = headers.findIndex((header) =>
      patterns.some((pattern) => pattern.test(header))
    );
    return index >= 0 ? index : fallback;
  }

  function isHeaderRow(cells) {
    const joined = cells.map(normalizeText).join(" ").toLowerCase();
    return joined.includes("halt date") || joined.includes("issue symbol");
  }

  function parseTradeHaltRows(rows, options = {}) {
    const reasonCodes = new Set(
      (options.reasonCodes || DEFAULT_REASON_CODES).map((code) =>
        normalizeText(code).toUpperCase()
      )
    );
    const expectedDate = options.today || todayNasdaqDate();
    const onlyToday = options.onlyToday !== false;
    const onlyOpenHalts = options.onlyOpenHalts !== false;
    const normalizedRows = rows
      .map((row) => row.map(normalizeText))
      .filter((row) => row.some(Boolean));

    if (normalizedRows.length === 0) {
      return [];
    }

    const headerRow = normalizedRows.find(isHeaderRow) || [];
    const dataRows = headerRow.length
      ? normalizedRows.filter((row) => row !== headerRow)
      : normalizedRows;

    const haltDateIndex = findHeaderIndex(
      headerRow,
      [/^halt date$/i, /\bhalt date\b/i],
      0
    );
    const haltTimeIndex = findHeaderIndex(
      headerRow,
      [/^halt time$/i, /\bhalt time\b/i],
      1
    );
    const symbolIndex = findHeaderIndex(
      headerRow,
      [/\bissue symbol\b/i, /^symbol$/i],
      2
    );
    const nameIndex = findHeaderIndex(
      headerRow,
      [/\bissue name\b/i, /^name$/i],
      3
    );
    const reasonIndex = findHeaderIndex(
      headerRow,
      [/\breason code\b/i, /^reason$/i],
      5
    );
    const resumptionDateIndex = findHeaderIndex(
      headerRow,
      [/\bresumption date\b/i],
      7
    );
    const resumptionQuoteTimeIndex = findHeaderIndex(
      headerRow,
      [/\bresumption quote time\b/i],
      8
    );
    const resumptionTradeTimeIndex = findHeaderIndex(
      headerRow,
      [/\bresumption trade time\b/i],
      9
    );

    return dataRows
      .map((cells) => {
        const symbol = normalizeText(cells[symbolIndex]).toUpperCase();
        const haltDate = normalizeText(cells[haltDateIndex]);
        const haltTime = normalizeText(cells[haltTimeIndex]);
        const reasonCode = normalizeText(cells[reasonIndex]).toUpperCase();
        const issueName = normalizeText(cells[nameIndex]);
        const resumptionDate = normalizeText(cells[resumptionDateIndex]);
        const resumptionQuoteTime = normalizeText(cells[resumptionQuoteTimeIndex]);
        const resumptionTradeTime = normalizeText(cells[resumptionTradeTimeIndex]);

        return {
          symbol,
          issueName,
          haltDate,
          haltTime,
          reasonCode,
          resumptionDate,
          resumptionQuoteTime,
          resumptionTradeTime
        };
      })
      .filter((halt) => halt.symbol && halt.haltDate && halt.reasonCode)
      .filter((halt) => !onlyToday || halt.haltDate === expectedDate)
      .filter((halt) => reasonCodes.size === 0 || reasonCodes.has(halt.reasonCode))
      .filter((halt) => !onlyOpenHalts || !halt.resumptionTradeTime);
  }

  function extractRowsFromDocument(documentRef) {
    const resultContainer = documentRef.querySelector("#divTradeHaltResults");
    const table =
      resultContainer?.querySelector(".genTable table") ||
      resultContainer?.querySelector("table") ||
      documentRef.querySelector("#divTradeHaltResults table");

    if (!table) {
      return [];
    }

    return Array.from(table.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent)
    );
  }

  const api = {
    DEFAULT_REASON_CODES,
    extractRowsFromDocument,
    normalizeText,
    parseTradeHaltRows,
    todayNasdaqDate
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.NasdaqHaltParser = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
