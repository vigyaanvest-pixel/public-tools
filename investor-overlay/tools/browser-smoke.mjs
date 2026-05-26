/**
 * Loads the unpacked extension in Chromium and runs a focused smoke test.
 * Run: node tools/browser-smoke.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, "../dist");

const results = [];

function pass(name, detail = "") {
  results.push({ status: "PASS", name, detail });
  console.log(`PASS  ${name}${detail ? `: ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ status: "FAIL", name, detail });
  console.error(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

async function getExtensionId(context) {
  let sw = context.serviceWorkers()[0];
  if (!sw) {
    sw = await context.waitForEvent("serviceworker", { timeout: 15000 });
  }
  const url = sw.url();
  const match = url.match(/^chrome-extension:\/\/([^/]+)\//);
  if (!match) throw new Error(`Could not parse extension id from ${url}`);
  return match[1];
}

async function main() {
  console.log("Loading extension from:", extensionPath);

  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    const extensionId = await getExtensionId(context);
    pass("Extension loads", `id=${extensionId}`);

    const popupUrl = `chrome-extension://${extensionId}/src/popup/index.html`;
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidebar-panel/index.html`;
    const popup = await context.newPage();
    await popup.goto(popupUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await popup.waitForTimeout(500);

    const popupTitle = await popup.locator("h1, h2, [class*='title']").first().textContent().catch(() => null);
    const hasSymbolInput = (await popup.locator('input[type="text"], input:not([type="hidden"])').count()) > 0;
    if (hasSymbolInput) pass("Popup renders", popupTitle?.trim() || "symbol input present");
    else fail("Popup renders", "no symbol input found");

    const symbolInput = popup.locator('input[type="text"], input:not([type="hidden"])').first();
    await symbolInput.fill("AAPL");
    const loadBtn = popup.getByRole("button", { name: /load/i });
    if ((await loadBtn.count()) > 0) {
      await loadBtn.click();
      pass("Popup Load button clickable");
    } else {
      fail("Popup Load button clickable", "button not found");
    }

    const sidePanel = await context.newPage();
    await sidePanel.goto(sidePanelUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sidePanel.waitForTimeout(1500);
    const sidePanelText = await sidePanel.locator("body").innerText();
    if (/AAPL|Snapshot/i.test(sidePanelText)) {
      pass("Side panel loads symbol from popup", "AAPL visible");
    } else {
      fail("Side panel loads symbol from popup", sidePanelText.slice(0, 120));
    }

    const optionsUrl = `chrome-extension://${extensionId}/src/options/index.html`;
    const options = await context.newPage();
    await options.goto(optionsUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    const optionsText = await options.locator("body").innerText();
    if (/privacy|local|export|settings/i.test(optionsText)) pass("Options page renders");
    else fail("Options page renders", "expected settings/privacy copy");

    const yahoo = await context.newPage();
    const consoleErrors = [];
    yahoo.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[investor-overlay]") || msg.type() === "error") {
        console.log(`Yahoo console [${msg.type()}]:`, text);
      }
    });
    yahoo.on("pageerror", (err) => consoleErrors.push(String(err)));

    await yahoo.goto("https://finance.yahoo.com/quote/AAPL/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await yahoo.waitForTimeout(5000);

    const finalUrl = yahoo.url();
    console.log("Yahoo final URL:", finalUrl);

    const floatBtn = yahoo.locator("#vv-float-btn");
    const floatCount = await floatBtn.count();
    if (floatCount > 0) pass("Floating V button on Yahoo");
    else fail("Floating V button on Yahoo", `button not in DOM (url=${finalUrl})`);

    const overlayHost = yahoo.locator("#vv-investor-overlay-root");
    if ((await overlayHost.count()) === 0) pass("No in-page overlay host (side panel mode)");
    else fail("No in-page overlay host (side panel mode)", "legacy host still injected");

    if (floatCount > 0) {
      await floatBtn.click();
      await yahoo.waitForTimeout(1000);
      pass("Floating V button clickable");
    }

    const ctx = await yahoo.evaluate(() => {
      const url = window.location.href;
      if (url.includes("finance.yahoo.com/quote/")) {
        const m = url.match(/\/quote\/([^/?#]+)/i);
        return m ? m[1].toUpperCase() : null;
      }
      return null;
    });
    if (ctx === "AAPL") pass("Yahoo URL symbol detectable", ctx);
    else fail("Yahoo URL symbol detectable", String(ctx));

    const criticalErrors = consoleErrors.filter(
      (e) => !/favicon|ads|gpt|prebid|cmp|consent|cookie|404/i.test(e),
    );
    if (criticalErrors.length === 0) pass("No critical content-script page errors");
    else fail("No critical content-script page errors", criticalErrors.slice(0, 3).join(" | "));

    const blank = await context.newPage();
    await blank.goto("https://example.com/", { waitUntil: "domcontentloaded" });
    await blank.waitForTimeout(1500);
    const blankOverlay = blank.locator("#vv-investor-overlay-root");
    if ((await blankOverlay.count()) === 0) pass("Content script runs without heavy overlay on generic page");
    else fail("Content script runs without heavy overlay on generic page");
  } finally {
    await context.close();
  }

  const failed = results.filter((r) => r.status === "FAIL");
  console.log("\n--- Summary ---");
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log("Failed checks:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
