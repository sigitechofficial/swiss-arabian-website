# One-shot: restore broken monolith closer, extract standalone products.html
from pathlib import Path
import re
import shutil

ROOT = Path(r"E:\claude-project-swiss\claude")
CUR = ROOT / "swiss-arabian-prototype.html"
BAK = ROOT / "swiss-arabian-prototype.pre-rtl.bak.html"
OUT = ROOT / "v4-app"
INSERT = ROOT / "_sa_app_insert"

OUT.mkdir(exist_ok=True)

cur = CUR.read_text(encoding="utf-8", errors="replace")
pre = BAK.read_text(encoding="utf-8", errors="replace")

marker = '<script type="text/html" id="doc-detail">'
ci = cur.find(marker)
pi = pre.find(marker)
print("detail marker current", ci, "pre", pi)
if ci < 0 or pi < 0:
    raise SystemExit("doc-detail marker missing")

# Restore iframe prototype: keep current products (complete), splice complete detail+showPage
restored = cur[:ci] + pre[pi:]
if "function showPage(name)" not in restored:
    raise SystemExit("restore missing showPage")
if not restored.rstrip().endswith("</html>"):
    raise SystemExit("restore missing </html>")
CUR.write_text(restored, encoding="utf-8", newline="\n")
print("restored monolith", CUR.stat().st_size, "showPage", True)

# Extract products srcdoc from restored file
ps = restored.find('<script type="text/html" id="doc-products">')
pe = restored.find(marker)
if ps < 0 or pe <= ps:
    raise SystemExit("products slice missing")
tag = '<script type="text/html" id="doc-products">'
inner = restored[ps + len(tag):pe]
if inner.rstrip().endswith("</script>"):
    inner = inner[: inner.rstrip().rfind("</script>")]
inner = inner.replace("__ENDSCRIPT__", "</script>")
print("extracted products chars", len(inner), "html close", inner.count("</html>"))

# Path rewrites so assets resolve from /v4-app/
repls = [
    ('src="v4-hover/', 'src="../v4-hover/'),
    ("src='v4-hover/", "src='../v4-hover/"),
    ('src="v4-pdp/', 'src="../v4-pdp/'),
    ("src='v4-pdp/", "src='../v4-pdp/"),
    ('href="v4-hover/', 'href="../v4-hover/'),
    ('url("video-img-v/', 'url("../video-img-v/'),
    ('url(video-img-v/', 'url(../video-img-v/'),
    ('src="video-img-v/', 'src="../video-img-v/'),
    ('href="../landing/landing.html"', 'href="landing.html"'),
    ('href="../products-variant-b/"', 'href="products.html"'),
    ('href="../products-variant-b/index.html"', 'href="products.html"'),
]
for a, b in repls:
    n = inner.count(a)
    if n:
        inner = inner.replace(a, b)
        print("rewrote", a, n)

# Drop inlined sa-app-shell CSS/JS so we own them in app.css / app.js
inner = re.sub(
    r"\n/\* sa-app-shell[\s\S]*?(?=</style>)",
    "\n",
    inner,
    count=1,
)
inner = re.sub(
    r"\n<script>\s*/\* sa-app-shell \*/[\s\S]*?</script>",
    "\n",
    inner,
    count=1,
)

# Viewport-fit for safe-area
inner = inner.replace(
    'name="viewport" content="width=device-width, initial-scale=1"',
    'name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"',
    1,
)

# External CSS/JS
if 'href="app.css"' not in inner:
    inner = inner.replace("</head>", '  <link rel="stylesheet" href="app.css">\n</head>', 1)
if 'src="app.js"' not in inner:
    # last </body> in this document
    idx = inner.rfind("</body>")
    if idx < 0:
        raise SystemExit("no </body> in products")
    inner = inner[:idx] + '  <script src="app.js" defer></script>\n' + inner[idx:]

# Standalone shop tab
inner = inner.replace('href="#products"', 'href="products.html"')

(OUT / "products.html").write_text(inner, encoding="utf-8", newline="\n")
print("wrote", OUT / "products.html", (OUT / "products.html").stat().st_size)

# Copy shell CSS/JS into v4-app
css = (INSERT / "shell.css").read_text(encoding="utf-8")
extra_css = r"""

/* --- standalone phone polish (v4-app) --- */
@media (max-width: 767px) {
  .sa-app-notes .filters-rail__list { display: contents; }
  .sa-app-notes { -webkit-overflow-scrolling: touch; }

  #ai-search,
  .ai-search,
  [data-search-overlay] {
    inset: 0 !important;
    width: 100% !important;
    max-width: none !important;
    height: 100% !important;
    border-radius: 0 !important;
  }

  #cart-drawer,
  .cart-drawer,
  [data-cart-drawer] {
    inset: auto 0 0 0 !important;
    top: auto !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    max-height: min(92dvh, 92vh) !important;
    border-radius: 18px 18px 0 0 !important;
    transform: translateY(110%);
  }
  html[dir="rtl"] #cart-drawer,
  html[dir="rtl"] .cart-drawer {
    left: 0 !important;
    right: 0 !important;
  }
  #cart-drawer.is-open,
  .cart-drawer.is-open,
  body.is-cart-open #cart-drawer,
  body.cart-open #cart-drawer {
    transform: translateY(0);
  }
}

@media (min-width: 768px) {
  .sa-app-discover,
  .sa-app-tabbar,
  .sa-app-sheet,
  .sa-app-lang,
  .sa-app-heart,
  .sa-app-note { display: none !important; }
}
"""
(OUT / "app.css").write_text(css + extra_css, encoding="utf-8", newline="\n")

js = (INSERT / "shell.js").read_text(encoding="utf-8")
# Patch shop tab to stay on this page
js = js.replace(
    'shopTab.addEventListener("click", function (e) { e.preventDefault(); });',
    'shopTab.addEventListener("click", function (e) { e.preventDefault(); });\n'
    '    // standalone pages (no iframe parent)\n'
    '    document.addEventListener("click", function (e) {\n'
    '      var a = e.target.closest && e.target.closest("[data-page]");\n'
    '      if (!a) return;\n'
    '      if (window.parent && window.parent !== window && window.parent.showPage) return;\n'
    '      var page = a.getAttribute("data-page");\n'
    '      if (!page) return;\n'
    '      e.preventDefault();\n'
    '      if (page === "landing") location.href = "landing.html";\n'
    '      else if (page === "products") location.href = "products.html";\n'
    '      else if (page === "detail") location.href = "../swiss-arabian-prototype.html#detail";\n'
    '    }, true);\n'
)
# Ensure i18n keys exist
i18n_boot = r"""
(function () {
  var extra = {
    en: {
      "app.find": "Find a scent",
      "app.filter": "Filter",
      "app.sort": "Sort",
      "app.clear": "Clear",
      "app.apply": "Apply",
      "app.tab.home": "Home",
      "app.tab.shop": "Shop",
      "app.tab.search": "Search",
      "app.tab.bag": "Bag",
      "app.showing": "Showing {x} of {n}",
      "app.save": "Save",
      "app.add": "Add"
    },
    ar: {
      "app.find": "ابحث عن عطر",
      "app.filter": "تصفية",
      "app.sort": "ترتيب",
      "app.clear": "مسح",
      "app.apply": "تطبيق",
      "app.tab.home": "الرئيسية",
      "app.tab.shop": "المتجر",
      "app.tab.search": "بحث",
      "app.tab.bag": "الحقيبة",
      "app.showing": "عرض {x} من {n}",
      "app.save": "حفظ",
      "app.add": "أضف"
    }
  };
  var prev = window.__saI18n;
  if (prev && typeof prev.t === "function") {
    var orig = prev.t.bind(prev);
    prev.t = function (key, fallback) {
      var lang = (prev.getLang && prev.getLang()) || document.documentElement.lang || "en";
      lang = String(lang).toLowerCase().indexOf("ar") === 0 ? "ar" : "en";
      var pack = extra[lang] || extra.en;
      if (pack[key]) return pack[key];
      return orig(key, fallback);
    };
  }
})();
"""
(OUT / "app.js").write_text(i18n_boot + "\n" + js, encoding="utf-8", newline="\n")

# Lightweight Home so the tab works without the iframe
landing = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Swiss Arabian</title>
  <link rel="stylesheet" href="app.css">
  <style>
    html, body { margin: 0; min-height: 100%; background: #faf6ee; color: #241f1b; font-family: "Benton Sans", "Helvetica Neue", sans-serif; }
    .home { min-height: 100dvh; display: flex; flex-direction: column; padding: 1.25rem 1.25rem calc(72px + env(safe-area-inset-bottom, 0px)); }
    .home__brand { letter-spacing: 0.18em; text-transform: uppercase; font-size: 0.78rem; }
    .home__hero { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding-block: 2.5rem; }
    .home__hero h1 { font-size: clamp(2rem, 8vw, 3.4rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 0.75rem; }
    .home__hero p { margin: 0 0 1.5rem; max-width: 28ch; opacity: 0.72; }
    .home__cta { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 1.25rem; background: #8c4435; color: #fffdf8; text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.78rem; }
    .sa-app-tabbar { display: flex !important; }
    @media (min-width: 768px) {
      .home { max-width: 720px; margin-inline: auto; }
    }
  </style>
</head>
<body>
  <main class="home">
    <div class="home__brand">Swiss Arabian</div>
    <div class="home__hero">
      <h1>Fragrance, found.</h1>
      <p>A house of oud, rose, and amber — since 1974.</p>
      <a class="home__cta" href="products.html">Shop scents</a>
    </div>
  </main>
  <nav class="sa-app-tabbar" aria-label="App" style="display:flex">
    <a class="sa-app-tab" href="landing.html" aria-current="page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20H4v-8.5Z"/><path d="M9 20v-6h6v6"/></svg>
      <span>Home</span>
    </a>
    <a class="sa-app-tab" href="products.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>
      <span>Shop</span>
    </a>
    <a class="sa-app-tab" href="products.html#search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <span>Search</span>
    </a>
    <a class="sa-app-tab" href="products.html#bag">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>
      <span>Bag</span>
    </a>
  </nav>
</body>
</html>
"""
(OUT / "landing.html").write_text(landing, encoding="utf-8", newline="\n")

# Sanity
prod = (OUT / "products.html").read_text(encoding="utf-8", errors="replace")
print("products endswith html", prod.rstrip().endswith("</html>"))
print("has app.css", 'href="app.css"' in prod)
print("has app.js", 'src="app.js"' in prod)
print("has __ENDSCRIPT__", "__ENDSCRIPT__" in prod)
print("has sa-app-discover", "sa-app-discover" in prod)
print("has sa-app-tabbar", "sa-app-tabbar" in prod)
print("has ../v4-hover", "../v4-hover/" in prod)
print("no srcdoc", "srcdoc" not in prod.lower())
print("done")
