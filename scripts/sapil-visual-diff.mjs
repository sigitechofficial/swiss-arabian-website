#!/usr/bin/env node
/**
 * Sapil visual diff: screenshots one component area from the approved v9 reference HTML
 * and the same component from our kit page (/sapil-kit), at 390 / 768 / 1280 / 1440 px,
 * and reports the share of pixels that differ.
 *
 *   1. Run the kit:   SAPIL_KIT=1 npx next dev -p 3021      (or next start with SAPIL_KIT=1)
 *   2. Run the diff:  node scripts/sapil-visual-diff.mjs [--only=card,buttons] [--widths=390,1440] [--out=dir]
 *
 * Env:
 *   SAPIL_DESIGN_DIR  folder holding sapil-v9-*.html (default: the approved design folder)
 *   KIT_URL           default http://localhost:3021/sapil-kit
 *                     (page specs with `kit: "catalog"` open `${KIT_URL}/catalog`: the catalog
 *                     fixture page, src/brands/sapil/kit/CatalogKit.tsx, real page components
 *                     filled with the v9 mock products)
 *   REF_PORT          static server for the design folder, default 3022
 *   CHROME_PATH       Chrome/Chromium binary (default: Playwright's cached Chromium, then Chrome)
 *
 * Browser driver: `playwright` / `playwright-core` if installed, else `puppeteer-core` from
 * node_modules or the npx cache. No new dependencies. Pixel compare runs inside the browser
 * (canvas getImageData), so no pngjs/pixelmatch is needed: a pixel counts as different when any
 * RGB channel differs by more than THRESHOLD (default 24 of 255, ~ pixelmatch's 0.1).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "1"];
  }),
);
const DESIGN_DIR =
  process.env.SAPIL_DESIGN_DIR ||
  "C:/Users/DELL/Downloads/sapil/repo/sapil-Ahsan";
const KIT_URL = process.env.KIT_URL || "http://localhost:3021/sapil-kit";
const REF_PORT = Number(process.env.REF_PORT || 3022);
const WIDTHS = (args.widths || "390,768,1280,1440").split(",").map(Number);
const THRESHOLD = Number(args.threshold || 24);
const OUT = args.out || path.join(os.tmpdir(), "sapil-visual-diff");
const HEIGHT = 900;

/* ——— what to compare: reference page + how to find the element; kit element id ——— */
const CART = JSON.stringify([{ id: "berry-crush", qty: 1 }]);
const SPECS = [
  {
    name: "card",
    page: "sapil-v9-shop.html",
    // the Berry Crush card in the shop grid
    find: `[...document.querySelectorAll('.grid .card')].find(c => c.querySelector('h3')?.textContent.trim() === 'Berry Crush')`,
  },
  {
    name: "buttons",
    page: "sapil-v9-note-by-note.html",
    find: `document.querySelector('.d-intro .ctas')`,
  },
  {
    name: "subnav",
    page: "sapil-v9-note-by-note.html",
    find: `document.querySelector('.subnav')`,
  },
  {
    name: "announce",
    page: "sapil-v9-note-by-note.html",
    find: `document.querySelector('.announce')`,
  },
  {
    name: "sechead",
    page: "sapil-v9-note-by-note.html",
    find: `document.querySelector('#new .sec-head')`,
  },
  {
    name: "fields",
    page: "sapil-v9-checkout.html",
    cart: true,
    find: `document.querySelector('#stepDelivery fieldset')`,
  },
  {
    name: "radiocards",
    page: "sapil-v9-checkout.html",
    cart: true,
    prepare: `(() => { const d = document.querySelector('#stepDelivery'), p = document.querySelector('#stepPayment'); d.hidden = true; p.hidden = false; })()`,
    find: `document.querySelector('#payOpts')`,
  },
  {
    name: "steps",
    page: "sapil-v9-checkout.html",
    cart: true,
    find: `document.querySelector('#steps')`,
  },
  {
    name: "crumbs",
    page: "sapil-v9-blog.html",
    find: `document.querySelector('.crumbs')`,
  },
  /* ——— catalog pages (kit: /sapil-kit/catalog, real Sapil components with the v9 mock products) ——— */
  {
    name: "shop-toolbar",
    kit: "catalog",
    page: "sapil-v9-shop.html",
    find: `document.querySelector('#toolbar')`,
  },
  {
    name: "shop-grid",
    kit: "catalog",
    page: "sapil-v9-shop.html",
    // the first eight cards (two rows on desktop)
    prepare: `document.querySelectorAll('#shopGrid > .card').forEach((c, i) => { if (i >= 8) c.remove(); })`,
    find: `document.querySelector('#shopGrid')`,
  },
  {
    name: "shop-hero",
    kit: "catalog",
    page: "sapil-v9-shop.html",
    find: `document.querySelector('#shopHero')`,
  },
  {
    name: "pdp-gallery",
    kit: "catalog",
    page: "sapil-v9-product.html?id=berry-crush",
    find: `document.querySelector('.gallery')`,
    kitSel: `[data-sapil="gallery"]`,
  },
  {
    name: "pdp-pyramid",
    kit: "catalog",
    page: "sapil-v9-product.html?id=berry-crush",
    find: `document.querySelector('.pyramid')`,
    kitSel: `[data-sapil="pyramid"]`,
  },
  {
    name: "pdp-buyrow",
    kit: "catalog",
    page: "sapil-v9-product.html?id=berry-crush",
    find: `document.querySelector('.buy-row')`,
    kitSel: `[data-sapil="buy-row"]`,
  },
];

/* Same freeze on both sides: no motion, reveal states shown, sticky/fixed chrome out of the way. */
const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
.rv{opacity:1!important;transform:none!important}
.hdr,.toolbar,.gallery,.co-sum{position:static!important}
.hero-switch,.toast,.scrim,[data-kit-chrome]{display:none!important}
html{scroll-behavior:auto!important}`;

/* ——— driver ——— */
function tryResolve(id, from) {
  try {
    return createRequire(from).resolve(id);
  } catch {
    return null;
  }
}
async function loadDriver() {
  const here = pathToFileURL(path.join(process.cwd(), "package.json")).href;
  for (const id of ["playwright", "playwright-core"]) {
    const p = tryResolve(id, here);
    if (p) return { kind: "playwright", lib: await import(pathToFileURL(p).href) };
  }
  let p = tryResolve("puppeteer-core", here);
  if (!p) {
    const cache = path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), ".npm"),
      process.platform === "win32" ? "npm-cache/_npx" : "_npx",
    );
    const alt = path.join(os.homedir(), ".npm/_npx");
    for (const dir of [cache, alt]) {
      if (!fs.existsSync(dir)) continue;
      for (const d of fs.readdirSync(dir)) {
        const pkg = path.join(dir, d, "node_modules/puppeteer-core/package.json");
        if (fs.existsSync(pkg)) {
          p = tryResolve("puppeteer-core", pathToFileURL(pkg).href);
          if (p) break;
        }
      }
      if (p) break;
    }
  }
  if (!p)
    throw new Error(
      "No browser driver found. Install playwright (devDependency) or run `npx puppeteer-core --version` once to cache puppeteer-core.",
    );
  const mod = await import(pathToFileURL(p).href);
  return { kind: "puppeteer", lib: mod.default || mod };
}
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const pw = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), ".cache"),
    process.platform === "win32" ? "ms-playwright" : "ms-playwright",
  );
  if (fs.existsSync(pw)) {
    const dirs = fs
      .readdirSync(pw)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const d of dirs) {
      for (const rel of [
        "chrome-win64/chrome.exe",
        "chrome-win/chrome.exe",
        "chrome-linux/chrome",
        "chrome-linux64/chrome",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ]) {
        const f = path.join(pw, d, rel);
        if (fs.existsSync(f)) return f;
      }
    }
  }
  for (const f of [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ])
    if (fs.existsSync(f)) return f;
  throw new Error("No Chrome found; set CHROME_PATH.");
}

/* ——— static server for the design folder ——— */
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
function serve(dir, port) {
  const root = path.resolve(dir);
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const f = path.resolve(root, "." + u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(port, "127.0.0.1", () => ok(srv)));
}

/* ——— thin page API over both drivers ——— */
async function openBrowser(driver) {
  if (driver.kind === "playwright") {
    const b = await driver.lib.chromium.launch({ executablePath: chromePath() });
    return {
      close: () => b.close(),
      async page(width) {
        const ctx = await b.newContext({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1 });
        const pg = await ctx.newPage();
        return {
          goto: (u) => pg.goto(u, { waitUntil: "networkidle", timeout: 90000 }),
          init: (js) => pg.addInitScript(js),
          eval: (js) => pg.evaluate(js),
          shot: async (sel) => (await pg.locator(sel).first().screenshot()).toString("base64"),
          close: () => ctx.close(),
        };
      },
    };
  }
  const b = await driver.lib.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--hide-scrollbars", "--font-render-hinting=none", "--force-color-profile=srgb"],
  });
  return {
    close: () => b.close(),
    async page(width) {
      const pg = await b.newPage();
      await pg.setViewport({ width, height: HEIGHT, deviceScaleFactor: 1 });
      return {
        goto: (u) => pg.goto(u, { waitUntil: "networkidle0", timeout: 90000 }),
        init: (js) => pg.evaluateOnNewDocument(js),
        eval: (js) => pg.evaluate(js),
        shot: async (sel) => {
          const el = await pg.$(sel);
          if (!el) throw new Error("missing " + sel);
          return Buffer.from(await el.screenshot({ encoding: "binary" })).toString("base64");
        },
        close: () => pg.close(),
      };
    },
  };
}

const settle = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
})()`;

async function refShot(browser, spec, width) {
  const pg = await browser.page(width);
  try {
    await pg.init(`try{localStorage.setItem('sapil_cart_v9', ${JSON.stringify(spec.cart ? CART : "[]")})}catch(e){}`);
    await pg.goto(`http://127.0.0.1:${REF_PORT}/${spec.page}`);
    await pg.eval(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(FREEZE)}; document.head.append(s);
      document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); })()`);
    if (spec.prepare) await pg.eval(spec.prepare);
    await pg.eval(settle);
    // fx/fy: sub-pixel offset of the element on the page. Text is rasterised relative to the
    // pixel grid, so the kit element is nudged to the same fraction before its screenshot.
    const box = await pg.eval(`(() => { const el = ${spec.find}; if (!el) return null; el.setAttribute('data-diff-target', ''); el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); const f = v => ((v % 1) + 1) % 1; return { w: r.width, h: r.height, fx: f(r.left + scrollX), fy: f(r.top + scrollY) }; })()`);
    if (!box) throw new Error(`reference element not found for ${spec.name}`);
    await pg.eval(settle);
    return { png: await pg.shot("[data-diff-target]"), box };
  } finally {
    await pg.close();
  }
}

async function kitShot(browser, spec, width, refBox) {
  const pg = await browser.page(width);
  try {
    await pg.goto(`${KIT_URL}${spec.kit ? `/${spec.kit}` : ""}?only=${spec.name}`);
    await pg.eval(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(FREEZE)}; document.head.append(s); })()`);
    // the kit element takes the reference element's width (the grid column / container it sits in);
    // page specs point inside a real page with `kitSel`
    const sel = spec.kitSel || `[data-kit="${spec.name}"]`;
    await pg.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return; el.style.width = '${refBox.w}px'; el.style.boxSizing = 'border-box';
      const f = v => ((v % 1) + 1) % 1; const r = el.getBoundingClientRect();
      el.style.position = 'relative'; el.style.left = (f(${refBox.fx} - f(r.left + scrollX))) + 'px'; el.style.top = (f(${refBox.fy} - f(r.top + scrollY))) + 'px';
      el.scrollIntoView({block:'center'}); })()`);
    await pg.eval(settle);
    return await pg.shot(sel);
  } finally {
    await pg.close();
  }
}

/* in-browser pixel compare; returns { pct, w, h, diffPng } */
async function compare(browser, a, b) {
  const pg = await browser.page(400);
  try {
    await pg.goto("about:blank").catch(() => {});
    return await pg.eval(`(async () => {
      const load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]);
      const w = Math.max(A.width, B.width), h = Math.max(A.height, B.height);
      const px = img => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#ff00ff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
      const da = px(A), db = px(B);
      const out = document.createElement('canvas'); out.width = w; out.height = h; const ox = out.getContext('2d'); const od = ox.createImageData(w, h);
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i+1] - db[i+1]), Math.abs(da[i+2] - db[i+2]));
        if (d > ${THRESHOLD}) { n++; od.data[i] = 255; od.data[i+1] = 0; od.data[i+2] = 0; od.data[i+3] = 255; }
        else { const g = (da[i] + da[i+1] + da[i+2]) / 3; od.data[i] = od.data[i+1] = od.data[i+2] = 255 - (255 - g) * 0.25; od.data[i+3] = 255; }
      }
      ox.putImageData(od, 0, 0);
      return { pct: n / (w * h) * 100, w, h, aw: A.width, ah: A.height, bw: B.width, bh: B.height, diffPng: out.toDataURL('image/png').split(',')[1] };
    })()`);
  } finally {
    await pg.close();
  }
}

async function main() {
  const driver = await loadDriver();
  console.log(`driver: ${driver.kind}; chrome: ${chromePath()}`);
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(DESIGN_DIR, REF_PORT);
  const browser = await openBrowser(driver);
  const only = args.only ? args.only.split(",") : null;
  if (args.probe) {
    // print each reference element's markup (to copy mock values into the kit)
    for (const spec of SPECS.filter((s) => !only || only.includes(s.name))) {
      const pg = await browser.page(Number(args.probe) > 1 ? Number(args.probe) : 1440);
      await pg.init(`try{localStorage.setItem('sapil_cart_v9', ${JSON.stringify(spec.cart ? CART : "[]")})}catch(e){}`);
      await pg.goto(`http://127.0.0.1:${REF_PORT}/${spec.page}`);
      if (spec.prepare) await pg.eval(spec.prepare);
      console.log(`\n=== ${spec.name}\n` + (await pg.eval(`(() => { const el = ${spec.find}; return el ? Math.round(el.getBoundingClientRect().width) + 'px ' + el.outerHTML : 'NOT FOUND'; })()`)));
      await pg.close();
    }
    await browser.close();
    srv.close();
    return;
  }
  const rows = [];
  try {
    for (const spec of SPECS.filter((s) => !only || only.includes(s.name))) {
      for (const width of WIDTHS) {
        try {
          const ref = await refShot(browser, spec, width);
          const kit = await kitShot(browser, spec, width, ref.box);
          const r = await compare(browser, ref.png, kit);
          const base = path.join(OUT, `${spec.name}-${width}`);
          fs.writeFileSync(base + "-ref.png", Buffer.from(ref.png, "base64"));
          fs.writeFileSync(base + "-kit.png", Buffer.from(kit, "base64"));
          fs.writeFileSync(base + "-diff.png", Buffer.from(r.diffPng, "base64"));
          rows.push({ component: spec.name, width, diff: r.pct.toFixed(2) + "%", ref: `${r.aw}x${r.ah}`, kit: `${r.bw}x${r.bh}` });
        } catch (e) {
          rows.push({ component: spec.name, width, diff: "error", ref: String(e.message).slice(0, 80), kit: "" });
        }
        console.log(rows.at(-1));
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  console.table(rows);
  console.log(`images: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
