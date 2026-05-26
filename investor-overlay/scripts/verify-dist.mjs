import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

function fail(msg) {
  console.error("verify-dist FAIL:", msg);
  process.exit(1);
}

if (!fs.existsSync(path.join(dist, "manifest.json"))) {
  fail("dist/manifest.json missing — run npm run build first");
}

const manifest = JSON.parse(fs.readFileSync(path.join(dist, "manifest.json"), "utf8"));
if (!manifest.action?.default_popup) fail("manifest missing action.default_popup");
if (!manifest.side_panel?.default_path) fail("manifest missing side_panel.default_path");

const sidePanelPath = path.join(dist, manifest.side_panel.default_path);
if (!fs.existsSync(sidePanelPath)) {
  fail(`side panel HTML missing: ${manifest.side_panel.default_path}`);
}

const popupPath = path.join(dist, manifest.action.default_popup);
if (!fs.existsSync(popupPath)) {
  fail(`popup HTML missing: ${manifest.action.default_popup}`);
}

const popupHtml = fs.readFileSync(popupPath, "utf8");
if (popupHtml.includes('src="/assets/')) {
  fail("popup HTML uses absolute /assets paths — Edge may fail to load scripts");
}

if (!fs.existsSync(path.join(dist, "service-worker-loader.js"))) {
  fail("service-worker-loader.js missing");
}

console.log("verify-dist OK — load unpacked folder:");
console.log(" ", dist);
