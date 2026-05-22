const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const edgePath = process.env.MARKET_SQUAWK_EDGE_PATH ||
  path.join(process.env["ProgramFiles(x86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe");
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "market-squawk-edge-"));
const port = 9333;

const sources = [
  ["TradingView News Flow", "https://www.tradingview.com/news-flow/"],
  ["Finviz News", "https://finviz.com/news"],
  ["MarketWatch", "https://www.marketwatch.com/latest-news?mod=home_ln"]
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function waitForCdp() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      await fetchJson(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch (_error) {
      await delay(250);
    }
  }
  throw new Error("Edge remote debugging port did not become ready.");
}

async function openTab(url) {
  const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`;
  return fetchJson(endpoint, { method: "PUT" });
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message || JSON.stringify(message.error)));
      } else {
        resolve(message.result);
      }
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((sendResolve, sendReject) => {
            pending.set(id, { resolve: sendResolve, reject: sendReject });
            setTimeout(() => {
              if (pending.has(id)) {
                pending.delete(id);
                sendReject(new Error(`Timed out waiting for ${method}`));
              }
            }, 10000);
          });
        },
        close() {
          ws.close();
        }
      });
    });
    ws.addEventListener("error", reject);
  });
}

async function evaluateExpression(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return result.result?.value;
}

async function testSource(name, url) {
  const tab = await openTab(url);
  const client = await connect(tab.webSocketDebuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await delay(8000);

  const result = await evaluateExpression(client, `(() => {
    const badge = document.getElementById("market-squawk-status");
    const sourceText = badge?.textContent || "";
    const headlineCount = Array.from(document.querySelectorAll("article,tr,li,a,[role='row']"))
      .filter((node) => (node.innerText || node.textContent || "").trim().length > 18)
      .length;
    return {
      href: location.href,
      title: document.title,
      badgePresent: Boolean(badge),
      badgeText: sourceText,
      headlineCandidates: headlineCount
    };
  })()`);

  await client.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`).catch(() => {});
  return { name, url, ...result };
}

async function main() {
  if (!fs.existsSync(edgePath)) {
    throw new Error(`Edge not found at ${edgePath}`);
  }

  const edge = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--disable-extensions-except=${repoRoot}`,
    `--load-extension=${repoRoot}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank"
  ], { stdio: "ignore", detached: false });

  try {
    await waitForCdp();
    const results = [];
    for (const [name, url] of sources) {
      try {
        results.push(await testSource(name, url));
      } catch (error) {
        results.push({ name, url, error: error.message });
      }
    }

    console.table(results.map((result) => ({
      source: result.name,
      loaded: Boolean(result.title || result.href),
      badge: Boolean(result.badgePresent),
      candidates: result.headlineCandidates ?? "",
      error: result.error || ""
    })));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    edge.kill();
    await delay(1000);
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
