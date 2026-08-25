"""Extract landing.html from prototype and fix cross-page links in v4.1."""
from pathlib import Path
import re

ROOT = Path(r"E:\claude-project-swiss\claude")
V5 = ROOT / "v4.1"
PROTO = ROOT / "swiss-arabian-prototype.html"

# --- Extract landing from doc-landing ---
proto = PROTO.read_text(encoding="utf-8", errors="replace")
ls = proto.find('<script type="text/html" id="doc-landing">')
le = proto.find('<script type="text/html" id="doc-products">')
if ls < 0 or le <= ls:
    raise SystemExit("doc-landing slice missing")
tag = '<script type="text/html" id="doc-landing">'
inner = proto[ls + len(tag) : le]
if inner.rstrip().endswith("</script>"):
    inner = inner[: inner.rstrip().rfind("</script>")]
inner = inner.replace("__ENDSCRIPT__", "</script>")
print("extracted landing chars", len(inner))

repls = [
    ('src="v4-hover/', 'src="../v4-hover/'),
    ("src='v4-hover/", "src='../v4-hover/"),
    ('src="v4-pdp/', 'src="../v4-pdp/'),
    ("src='v4-pdp/", "src='../v4-pdp/"),
    ('href="v4-hover/', 'href="../v4-hover/'),
    ('url("video-img-v/', 'url("../video-img-v/'),
    ("url('video-img-v/", "url('../video-img-v/"),
    ('url(video-img-v/', 'url(../video-img-v/'),
    ('src="video-img-v/', 'src="../video-img-v/'),
    ('href="../landing/landing.html"', 'href="landing.html"'),
    ('href="../landing/landing.html#', 'href="landing.html#'),
    ('href="../products-variant-b/products-variant-b.html"', 'href="products.html"'),
    ('href="../products-variant-b/"', 'href="products.html"'),
    ('href="../products-variant-b/index.html"', 'href="products.html"'),
    ('href="../v4-pdp/v4-pdp.html"', 'href="detail.html"'),
    ('href="#products"', 'href="products.html"'),
    ('href="#landing"', 'href="landing.html"'),
    ('href="#detail"', 'href="detail.html"'),
    ('href="../swiss-arabian-prototype.html#detail"', 'href="detail.html"'),
    ('href="../swiss-arabian-prototype.html#products"', 'href="products.html"'),
    ('href="../swiss-arabian-prototype.html#landing"', 'href="landing.html"'),
]
for a, b in repls:
    n = inner.count(a)
    if n:
        inner = inner.replace(a, b)
        print("landing rewrote", a, n)

# Drop inlined sa-app-shell CSS/JS — use shared app.css / app.js
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

inner = inner.replace(
    'name="viewport" content="width=device-width, initial-scale=1"',
    'name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"',
    1,
)

if 'href="app.css"' not in inner:
    inner = inner.replace("</head>", '  <link rel="stylesheet" href="app.css">\n</head>', 1)
if 'src="app.js"' not in inner:
    idx = inner.rfind("</body>")
    if idx < 0:
        raise SystemExit("no </body> in landing")
    inner = inner[:idx] + '  <script src="app.js" defer></script>\n' + inner[idx:]

(V5 / "landing.html").write_text(inner, encoding="utf-8", newline="\n")
print("wrote landing.html", (V5 / "landing.html").stat().st_size)

# --- Fix links in products.html and detail.html ---
nav_repls = [
    ('href="../products-variant-b/products-variant-b.html"', 'href="products.html"'),
    ('href="../products-variant-b/"', 'href="products.html"'),
    ('href="../products-variant-b/index.html"', 'href="products.html"'),
    ('href="../landing/landing.html"', 'href="landing.html"'),
    ('href="../v4-pdp/v4-pdp.html"', 'href="detail.html"'),
    ('href="#products"', 'href="products.html"'),
    ('href="#landing"', 'href="landing.html"'),
    ('href="#detail"', 'href="detail.html"'),
    ('href="../swiss-arabian-prototype.html#detail"', 'href="detail.html"'),
    ('href="../swiss-arabian-prototype.html#products"', 'href="products.html"'),
    ('href="../swiss-arabian-prototype.html#landing"', 'href="landing.html"'),
    ("location.href='../swiss-arabian-prototype.html#detail'", "location.href='detail.html'"),
    ('location.href="../swiss-arabian-prototype.html#detail"', 'location.href="detail.html"'),
]

for fname in ("products.html", "detail.html"):
    p = V5 / fname
    text = p.read_text(encoding="utf-8", errors="replace")
    orig = text
    for a, b in nav_repls:
        text = text.replace(a, b)
    # Patch showPage fallback in inline nav interceptors
    text = re.sub(
        r"else if\(t==='detail'\) location\.href='[^']*'",
        "else if(t==='detail') location.href='detail.html'",
        text,
    )
    text = re.sub(
        r'else if\(page==="detail"\) location\.href="[^"]*"',
        'else if(page==="detail") location.href="detail.html"',
        text,
    )
    if text != orig:
        p.write_text(text, encoding="utf-8", newline="\n")
        print("patched", fname)
    else:
        print("no changes", fname)

print("done")
