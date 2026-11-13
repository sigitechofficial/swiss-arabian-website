#!/usr/bin/env node
/**
 * Brand coverage sweep: opens every storefront route of one running build
 * (English + /ar, 1280 then 390 px) and records, per page, whether it is drawn
 * in the expected brand's design system and nothing of the other brand leaks.
 *
 *   node scripts/brand-coverage-sweep.mjs --base=http://localhost:3060 --brand=sapil --out=<dir>
 *   node scripts/brand-coverage-sweep.mjs --base=http://localhost:3061 --brand=swiss-arabian --out=<dir>
 *   node scripts/brand-coverage-sweep.mjs --compare=<dirA>,<dirB>   (Swiss Arabian: baseline vs now)
 *
 * Per page: HTTP status of the document, final address, <title>, lang/dir, H1 count, horizontal
 * scroll, broken images, same-origin 4xx/5xx, console errors, and brand checks:
 * - sapil: visible elements outside any [data-brand="sapil"] subtree, "Swiss Arabian" text,
 *   Swiss Arabian assets (logo, loading bottle gif) or fonts (Benton Sans / GE SS) in use;
 * - swiss-arabian: any [data-brand="sapil"] subtree or `sapil-` class, "Sapil" text.
 * Screenshots (viewport, JPEG) and results.json go to --out. Uses the same browser driver as
 * scripts/sapil-visual-diff.mjs (puppeteer-core from the npx cache; Chrome or Playwright's
 * Chromium). No new dependencies.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "1"];
  }),
);

function tryResolve(id, from) {
  try {
    return createRequire(from).resolve(id);
  } catch {
    return null;
  }
}
async function loadPuppeteer() {
  let p = tryResolve("puppeteer-core", pathToFileURL(path.join(process.cwd(), "package.json")).href);
  if (!p) {
    const cache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), ".npm"), process.platform === "win32" ? "npm-cache/_npx" : "_npx");
    for (const dir of [cache, path.join(os.homedir(), ".npm/_npx")]) {
      if (!fs.existsSync(dir)) continue;
      for (const d of fs.readdirSync(dir)) {
        const pkg = path.join(dir, d, "node_modules/puppeteer-core/package.json");
        if (fs.existsSync(pkg) && (p = tryResolve("puppeteer-core", pathToFileURL(pkg).href))) break;
      }
      if (p) break;
    }
  }
  if (!p) throw new Error("puppeteer-core not found (run `npx puppeteer-core --version` once).");
  const mod = await import(pathToFileURL(p).href);
  return mod.default || mod;
}
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const pw = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), ".cache"), "ms-playwright");
  if (fs.existsSync(pw)) {
    for (const d of fs.readdirSync(pw).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      for (const rel of ["chrome-win64/chrome.exe", "chrome-win/chrome.exe", "chrome-linux/chrome"]) {
        const f = path.join(pw, d, rel);
        if (fs.existsSync(f)) return f;
      }
    }
  }
  for (const f of ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"]) if (fs.existsSync(f)) return f;
  throw new Error("No Chrome found; set CHROME_PATH.");
}

/** Every route under src/app/[locale] except (dev). `{x}` placeholders are discovered from the site. */
export const ROUTES = [
  "/", "/products", "/products/p/2", "/products/{product}", "/collections", "/collections/{collection}",
  "/collections/{collection}/p/2", "/categories/{category}", "/categories/{category}/p/2", "/search?q=oud",
  "/cart", "/checkout", "/checkout/payment/cancel", "/checkout/payment/success", "/checkout/payment/paymob",
  "/checkout/payment/stripe", "/order-confirmation/00000000-0000-0000-0000-000000000000",
  "/payments/tabby/return", "/payments/telr/return", "/track", "/track/UNKNOWN-1",
  "/login", "/register", "/verify", "/forgot-password", "/reset-password",
  "/account", "/account/addresses", "/account/orders", "/account/orders/x", "/account/payments", "/account/profile",
  "/account/returns", "/account/reviews", "/account/saved", "/account/security", "/account/wishlist",
  "/account/rewards", "/account/membership", "/account/subscription", "/account/subscription/x",
  "/account/employee-benefits", "/blog", "/blog/{post}", "/faq", "/our-story", "/stores", "/gift-box", "/gift-cards",
  "/pages/{page}", "/policies/{policy}", "/preview/home", "/review/sweep-token", "/offers/{offer}",
  "/subscriptions", "/subscriptions/{plan}", "/subscriptions/{plan}/checkout", "/lp/sweep-id", "/shop-unavailable",
  "/no-such-page-sweep",
];
const FALLBACK = { product: "no-product", collection: "no-collection", category: "no-category", post: "no-post", page: "privacy-policy", policy: "privacy-policy", offer: "NO-OFFER", plan: "NO-PLAN" };

async function discover(browser, base) {
  const found = { ...FALLBACK };
  const page = await browser.newPage();
  const firstLink = async (url, re) => {
    try {
      await page.goto(base + url, { waitUntil: "networkidle2", timeout: 60000 });
      return await page.evaluate((src) => {
        const r = new RegExp(src);
        const a = [...document.querySelectorAll("a[href]")].map((x) => new URL(x.href).pathname).find((h) => r.test(h));
        return a ? decodeURIComponent(a.split("/").filter(Boolean).pop()) : null;
      }, re.source);
    } catch {
      return null;
    }
  };
  found.product = (await firstLink("/products", /^\/products\/(?!p\/)[^/]+$/)) || found.product;
  found.collection = (await firstLink("/collections", /^\/collections\/[^/]+$/)) || found.collection;
  found.category = (await firstLink("/", /^\/categories\/[^/]+$/)) || found.category;
  found.post = (await firstLink("/blog", /^\/blog\/[^/]+$/)) || found.post;
  found.page = (await firstLink("/", /^\/pages\/[^/]+$/)) || found.page;
  found.policy = (await firstLink("/", /^\/policies\/[^/]+$/)) || found.policy;
  await page.close();
  if (args.offer) found.offer = args.offer;
  return found;
}

/* Runs in the page. */
function inspect(brand) {
  const vis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const text = (document.body.innerText || "").replace(/\s+/g, " ");
  const imgs = [...document.images];
  const out = {
    title: document.title,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    h1: document.querySelectorAll("h1").length,
    h1Text: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()).filter(Boolean).slice(0, 2).join(" | "),
    hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc).slice(0, 5),
    notFound: Boolean(document.querySelector("[data-page-not-found]")) || /404|not found|isn’t here|غير موجودة/i.test(document.title),
    textLength: text.length,
    issues: [],
  };
  const fontsInUse = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (!vis(el) || !el.childNodes.length) continue;
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) fontsInUse.add(getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim());
  }
  out.fonts = [...fontsInUse].slice(0, 8);
  if (brand === "sapil") {
    const outside = [];
    for (const el of document.body.querySelectorAll("body > *, body > * > *")) {
      if (el.closest('[data-brand="sapil"]') || el.querySelector('[data-brand="sapil"]')) continue;
      if (["SCRIPT", "STYLE", "LINK", "NOSCRIPT", "TEMPLATE", "NEXT-ROUTE-ANNOUNCER"].includes(el.tagName)) continue;
      if (vis(el) && (el.innerText || "").trim()) outside.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}: ${(el.innerText || "").trim().slice(0, 60)}`);
    }
    if (outside.length) out.issues.push(`outside Sapil root: ${outside.slice(0, 3).join(" / ")}`);
    if (/swiss arabian|سويس أرابيان/i.test(text)) out.issues.push("text mentions Swiss Arabian");
    if (imgs.some((i) => /swiss-arabian|sa-logo|loading-perfume/i.test(i.currentSrc || i.src))) out.issues.push("Swiss Arabian image/asset");
    const saFont = out.fonts.find((f) => /benton|ge ss|cormorant/i.test(f));
    if (saFont) out.issues.push(`Swiss Arabian font in use: ${saFont}`);
    if (!document.querySelector('[data-brand="sapil"]')) out.issues.push("no Sapil root");
  } else {
    if (document.querySelector('[data-brand="sapil"]') || document.querySelector('[class*="sapil-"]')) out.issues.push("Sapil markup on Swiss Arabian");
    if (/\bsapil\b|سابيل/i.test(text)) out.issues.push("text mentions Sapil");
    if (/Fraunces|Gloock|Poppins/.test(out.fonts.join(","))) out.issues.push("Sapil font in use");
  }
  return out;
}

async function sweep() {
  const base = (args.base || "").replace(/\/+$/, "");
  const brand = args.brand;
  const outDir = path.resolve(args.out || path.join(os.tmpdir(), `brand-sweep-${brand}`));
  if (!base || !brand) throw new Error("--base and --brand are required");
  fs.mkdirSync(outDir, { recursive: true });
  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
  const params = await discover(browser, base);
  console.log("params", params);
  const only = args.only ? args.only.split(",") : null;
  const jobs = [];
  for (const route of ROUTES) {
    if (only && !only.some((o) => route.includes(o))) continue;
    for (const locale of (args.locales || "en,ar").split(",")) jobs.push({ route, locale });
  }
  const results = [];
  const concurrency = Number(args.concurrency || 4);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      const filled = job.route.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(params[k]));
      const url = base + (job.locale === "en" ? filled : `/${job.locale}${filled === "/" ? "" : filled}`);
      const page = await browser.newPage();
      const consoleErrors = [];
      const badResponses = [];
      page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 160)));
      page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 160)));
      page.on("response", (r) => {
        const u = r.url();
        if (r.status() >= 400 && u.startsWith(base) && !u.includes("/_next/static")) badResponses.push(`${r.status()} ${u.replace(base, "").slice(0, 80)}`);
      });
      const row = { route: job.route, locale: job.locale, url, widths: {} };
      try {
        await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
        const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
        row.status = res?.status() ?? null;
        await new Promise((r) => setTimeout(r, 900));
        row.finalPath = new URL(page.url()).pathname + new URL(page.url()).search;
        const slug = `${job.route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}-${job.locale}`;
        for (const width of [1280, 390]) {
          if (width !== 1280) {
            await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
            await new Promise((r) => setTimeout(r, 700));
          }
          const data = await page.evaluate(inspect, brand);
          const shot = path.join(outDir, `${slug}-${width}.jpg`);
          await page.screenshot({ path: shot, type: "jpeg", quality: 55 });
          row.widths[width] = { ...data, shot: path.basename(shot) };
        }
        row.text = await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000));
      } catch (e) {
        row.error = String(e).slice(0, 200);
      }
      row.consoleErrors = [...new Set(consoleErrors)].slice(0, 6);
      row.badResponses = [...new Set(badResponses)].slice(0, 6);
      results.push(row);
      const w = row.widths[1280] || {};
      const issues = [...new Set([...(w.issues || []), ...((row.widths[390] || {}).issues || [])])];
      console.log(`${row.status ?? "ERR"} ${job.locale} ${job.route} -> ${row.finalPath ?? ""} ${w.notFound ? "[404 view]" : ""} ${issues.length ? "ISSUES: " + issues.join("; ") : "ok"}${(w.hScroll || row.widths[390]?.hScroll) ? " HSCROLL" : ""}`);
      await page.close();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  await browser.close();
  results.sort((a, b) => ROUTES.indexOf(a.route) - ROUTES.indexOf(b.route) || a.locale.localeCompare(b.locale));
  fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ base, brand, params, results }, null, 2));
  console.log(`wrote ${path.join(outDir, "results.json")}`);
}

/** Baseline vs now: same route, same locale, same width → % of differing pixels + text equality. */
async function compare() {
  const [dirA, dirB] = args.compare.split(",").map((d) => path.resolve(d));
  const A = JSON.parse(fs.readFileSync(path.join(dirA, "results.json"), "utf8"));
  const B = JSON.parse(fs.readFileSync(path.join(dirB, "results.json"), "utf8"));
  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true });
  const page = await browser.newPage();
  await page.setContent("<canvas id=a></canvas><canvas id=b></canvas>");
  const rows = [];
  for (const b of B.results) {
    const a = A.results.find((x) => x.route === b.route && x.locale === b.locale);
    if (!a) continue;
    const row = { route: b.route, locale: b.locale, statusA: a.status, statusB: b.status, sameText: a.text === b.text, diff: {} };
    for (const width of ["1280", "390"]) {
      const sa = a.widths?.[width]?.shot;
      const sb = b.widths?.[width]?.shot;
      if (!sa || !sb) continue;
      const da = "data:image/jpeg;base64," + fs.readFileSync(path.join(dirA, sa)).toString("base64");
      const db = "data:image/jpeg;base64," + fs.readFileSync(path.join(dirB, sb)).toString("base64");
      row.diff[width] = await page.evaluate(async (x, y) => {
        const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
        const [ia, ib] = await Promise.all([load(x), load(y)]);
        const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
        const ctx = (img) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
        const pa = ctx(ia), pb = ctx(ib);
        let d = 0;
        for (let i = 0; i < pa.length; i += 4) if (Math.abs(pa[i] - pb[i]) > 40 || Math.abs(pa[i + 1] - pb[i + 1]) > 40 || Math.abs(pa[i + 2] - pb[i + 2]) > 40) d++;
        return Math.round((d / (w * h)) * 10000) / 100;
      }, da, db);
    }
    rows.push(row);
    console.log(`${b.locale} ${b.route}: status ${a.status}->${b.status} text ${row.sameText ? "same" : "DIFFERS"} diff1280 ${row.diff["1280"] ?? "-"}% diff390 ${row.diff["390"] ?? "-"}%`);
  }
  await browser.close();
  fs.writeFileSync(path.join(dirB, "compare.json"), JSON.stringify(rows, null, 2));
}

if (args.compare) await compare();
else await sweep();
