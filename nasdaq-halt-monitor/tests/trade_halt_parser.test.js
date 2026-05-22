const assert = require("assert");
const {
  parseTradeHaltRows,
  todayNasdaqDate
} = require("../src/trade-halt-parser");

const today = todayNasdaqDate(new Date(2026, 4, 22));

const rows = [
  [
    "Halt Date",
    "Halt Time",
    "Issue Symbol",
    "Issue Name",
    "Market",
    "Reason Code",
    "Pause Threshold Price",
    "Resumption Date",
    "Resumption Quote Time",
    "Resumption Trade Time"
  ],
  [today, "10:12:03", "ABC", "ABC Corp", "NASDAQ", "LUDP", "", "", "", ""],
  [today, "10:15:00", "XYZ", "XYZ Corp", "NASDAQ", "T1", "", "", "", ""],
  [today, "10:18:00", "PENDING", "Pending Corp", "NASDAQ", "LUDP", "", today, "10:23:00", ""],
  [today, "10:20:00", "DONE", "Done Corp", "NASDAQ", "LUDP", "", today, "10:24:00", "10:25:00"],
  ["05/21/2026", "09:31:00", "OLD", "Old Corp", "NASDAQ", "LUDP", "", "", "", ""],
  [today, "11:00:00", "MISS", "Miss Corp", "NASDAQ", "H10", "", "", "", ""]
];

const halts = parseTradeHaltRows(rows, {
  today,
  reasonCodes: ["LUDP", "T1"],
  onlyOpenHalts: true
});

assert.deepStrictEqual(
  halts.map((halt) => halt.symbol),
  ["ABC", "XYZ", "PENDING"]
);

const allResumptionStates = parseTradeHaltRows(rows, {
  today,
  reasonCodes: ["LUDP"],
  onlyOpenHalts: false
});

assert.deepStrictEqual(
  allResumptionStates.map((halt) => halt.symbol),
  ["ABC", "PENDING", "DONE"]
);

console.log("trade_halt_parser.test.js passed");
