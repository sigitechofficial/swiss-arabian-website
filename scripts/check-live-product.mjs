import http from "node:http";

const port = 9334;
const origin =
  "https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io";
const feed =
  "https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io/storefront/catalog/products?zoneCode=UAE&languageCode=en&currencyCode=AED&countryCode=AE&salesChannelCode=platform_sa_uae&page=1&limit=8";

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(JSON.parse(data)));
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

async function evalValue(send, expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails.exception || result.exceptionDetails));
  }
  return result.result?.value;
}

const list = await getJson("http://127.0.0.1:" + port + "/json/list");
const page = list.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", () => reject(new Error("websocket failed")));
});
const send = cdp(ws);
await send("Page.enable");
const slug = await evalValue(
  send,
  `fetch(${JSON.stringify(feed)}).then(async (res) => {
    const data = await res.json();
    const rows = data.items || data.products || data.data?.items || data.data?.products || [];
    const first = Array.isArray(rows) ? rows[0] : null;
    if (!first) return JSON.stringify(data).slice(0, 800);
    return JSON.stringify({ keys: Object.keys(first), slug: first.slug, handle: first.handle, name: first.name || first.title });
  })`,
);
console.log("SLUG " + slug);
if (!slug || String(slug).startsWith("{") || String(slug).startsWith("[")) {
  ws.close();
  process.exit(0);
}
await send("Page.navigate", {
  url: origin + "/products/" + encodeURIComponent(slug),
});
let snapshot = null;
for (let i = 0; i < 24; i += 1) {
  await sleep(700);
  snapshot = await evalValue(
    send,
    "(() => ({ href: location.href, h1: (document.querySelector('h1') || {}).textContent || '', types: (window.InsiderQueue || []).map((row) => row && row.type) }))()",
  );
  if ((snapshot?.types || []).includes("product")) break;
}
console.log("PRODUCT " + JSON.stringify(snapshot));
ws.close();
