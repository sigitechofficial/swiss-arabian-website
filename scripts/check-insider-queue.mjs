import { spawn } from "node:child_process";
import http from "node:http";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = process.env.TEMP + "\\sa-insider-live";
const port = 9334;
const origin =
  "https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io";

const child = spawn(
  chrome,
  [
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
    "--no-first-run",
    "--no-default-browser-check",
    "--new-window",
    origin + "/",
  ],
  { detached: true, stdio: "ignore" },
);
child.unref();

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let id = 0;
function cdp(ws) {
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) item.reject(new Error(JSON.stringify(msg.error)));
      else item.resolve(msg.result);
    }
  });
  return (method, params = {}) => {
    const msgId = ++id;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };
}

async function pageTarget() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const list = await getJson("http://127.0.0.1:" + port + "/json/list");
      const page = list.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      // Chrome is still starting.
    }
    await sleep(400);
  }
  throw new Error("Chrome debugging page not found");
}

const expr =
  "(() => ({ href: location.href, types: (window.InsiderQueue || []).map((row) => row && row.type) }))()";

async function readQueue(send, want) {
  let last = null;
  for (let i = 0; i < 30; i += 1) {
    const result = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
    });
    last = result.result?.value ?? result.result;
    const types = last?.types ?? [];
    if (types.includes("init") && types.includes(want)) return last;
    await sleep(400);
  }
  return last;
}

const target = await pageTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", () => reject(new Error("websocket failed")));
});
const send = cdp(ws);
await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: origin + "/" });
await sleep(2000);
const home = await readQueue(send, "home");
console.log("HOME " + JSON.stringify(home));
const linkResult = await send("Runtime.evaluate", {
  expression:
    "(() => { const links = [...document.querySelectorAll('a[href]')].map((a) => a.href); const hit = links.find((href) => /\\/products\\/[^/?#]+$/.test(href) && !/\\.(png|jpe?g|webp|svg|gif|avif)$/i.test(href)); return hit || ''; })()",
  returnByValue: true,
});
const productUrl = linkResult.result?.value || origin + "/products/shaghaf-oud-ahmar";
console.log("PRODUCT_URL " + productUrl);
await send("Page.navigate", { url: productUrl });
await sleep(2500);
const product = await readQueue(send, "product");
const detail = await send("Runtime.evaluate", {
  expression:
    "(() => ({ title: document.title, h1: (document.querySelector('h1') || {}).textContent || '', cart: (window.InsiderQueue || []).some((row) => row && row.type === 'cart') }))()",
  returnByValue: true,
});
console.log("PRODUCT " + JSON.stringify(product));
console.log("DETAIL " + JSON.stringify(detail.result?.value));
ws.close();
