import { spawn } from "node:child_process";
import fs from "node:fs";

const EVIDENCE_DIR = "/Users/estebanlopez/.gemini/antigravity/brain/03869070-ec6c-4f05-bcd0-856a346f339f/evidence";
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Launch Chrome
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--window-size=1440,900",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-gl=angle",
    "about:blank",
  ],
  { stdio: "ignore" }
);

await sleep(1500);

// 2. Get WebSocket debugger URL
const versionRes = await fetch("http://localhost:9222/json/version");
const versionData = await versionRes.json();
const wsUrl = versionData.webSocketDebuggerUrl;

console.log("Connecting to Chrome CDP at:", wsUrl);
const ws = new WebSocket(wsUrl);

let idCounter = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

await new Promise((resolve) => (ws.onopen = resolve));

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = idCounter++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Create a target tab
const newTarget = await send("Target.createTarget", { url: "http://localhost:3000" });
const targetId = newTarget.result.targetId;

const session = await send("Target.attachToTarget", { targetId, flatten: true });
const sessionId = session.result.sessionId;

function sendSession(method, params = {}) {
  return new Promise((resolve) => {
    const id = idCounter++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, sessionId, method, params }));
  });
}

await sendSession("Page.enable");
await sendSession("Runtime.enable");
await sleep(3500); // Wait for R3F canvas to initialize

async function evaluate(expression) {
  const res = await sendSession("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log("Evaluate expression:", expression.trim().slice(0, 40), "->", res.result?.value || res.result);
  return res;
}

async function captureScreenshot(fileName) {
  const res = await sendSession("Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(res.result.data, "base64");
  const filePath = `${EVIDENCE_DIR}/${fileName}`;
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved screenshot: ${fileName} (${buffer.length} bytes)`);
}

// 1. Initial State Screenshot
await captureScreenshot("01_initial_rig.png");

// 2. Click "Endurance (42/58)" preset
await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Endurance'));
  if (btn) { btn.click(); return 'clicked endurance'; }
  return 'not found';
})()`);
await sleep(1500);
await captureScreenshot("02_endurance_preset.png");

// 3. Click "Side View" camera preset
await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Side View'));
  if (btn) { btn.click(); return 'clicked side view'; }
  return 'not found';
})()`);
await sleep(1500);
await captureScreenshot("03_side_profile_view.png");

// 4. Click "Bike Frame" tab
await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bike Frame'));
  if (btn) { btn.click(); return 'clicked bike frame'; }
  return 'not found';
})()`);
await sleep(1000);
await captureScreenshot("04_bike_geometry_tab.png");

// 5. Click "Clearance Buzz Test" preset
await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Clearance Buzz Test'));
  if (btn) { btn.click(); return 'clicked clearance buzz'; }
  return 'not found';
})()`);
await sleep(1500);
await captureScreenshot("05_clearance_buzz_hazard.png");

// 6. Click "Export Manifest" button to show Modal
await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Export Manifest'));
  if (btn) { btn.click(); return 'clicked export manifest'; }
  return 'not found';
})()`);
await sleep(1000);
await captureScreenshot("06_export_manifest_modal.png");

console.log("All evidence screenshots captured successfully!");
chrome.kill();
process.exit(0);
