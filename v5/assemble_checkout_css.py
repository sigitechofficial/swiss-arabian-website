"""Rebuild checkout.css: nav + footer from detail.html, page styles preserved."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent
detail = (root / "detail.html").read_text(encoding="utf-8")

style_match = re.search(r"<style>(.*?)</style>", detail, re.DOTALL)
if not style_match:
    raise SystemExit("Could not find <style> block in detail.html")
css = style_match.group(1)

scroll = css.find("/* ------------------------- SCROLL REVEAL")
if scroll < 0:
    raise SystemExit("Could not find SCROLL REVEAL marker in detail.html")
nav = css[css.find("/* nav-light.css"):scroll]

footer_start = css.find("/* =============================================================\n   7. FOOTER")
footer_end = css.find("/* =============================================================\n   9. INGREDIENT")
if footer_start < 0 or footer_end < 0:
    raise SystemExit("Could not find footer section in detail.html")
footer = css[footer_start:footer_end]

brand_start = css.find("/* --- Footer brand lockup")
brand_end = css.find("/* nav-light.css")
if brand_start >= 0 and brand_end > brand_start:
    footer += "\n" + css[brand_start:brand_end]

for block in (
    "  .site-footer__cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n",
    "  .site-footer__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-lg) var(--space-sm); }\n",
    "  .site-footer__legal { flex-direction: column; align-items: flex-start; }\n",
):
    if block.strip() not in footer and block in css:
        footer += "\n@media (max-width: 1023px) {\n" + block + "}\n" if "1023" in block or False else ""
# Append responsive footer rules from detail responsive section
footer += """
@media (max-width: 1023px) {
  .site-footer__cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .site-footer__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-lg) var(--space-sm); }
  .site-footer__legal { flex-direction: column; align-items: flex-start; }
}
"""

footer = footer.replace(".pd-c ", ".shop-flow ")
footer = footer.replace("var(--footer-bg)", "#8c4435")
footer = footer.replace("var(--footer-link)", "rgba(255,255,255,0.78)")
footer = footer.replace("var(--space-lg)", "2rem")
footer = footer.replace("var(--space-md)", "1.5rem")
footer = footer.replace("var(--space-2xs)", "0.5rem")
footer = footer.replace("var(--space-sm)", "1rem")
footer = footer.replace("var(--space-3xs)", "0.35rem")
footer = footer.replace("var(--weight-semibold)", "600")
footer = footer.replace("var(--transition-base)", "0.3s ease")

base = (root / "checkout.css").read_text(encoding="utf-8")
start = base.find(".cart-page-head")
if start < 0:
    start = base.find(".cart-head")
page_styles = base[start:] if start >= 0 else ""
page_styles = page_styles.replace(".cart-head ", ".cart-page-head ")
page_styles = page_styles.replace(".shop-crumb", ".crumbs")
page_styles = page_styles.replace(".shop-label", ".collection-head__eyebrow")

# Drop obsolete shop-footer block if still present
shop_footer = page_styles.find("/* --- Footer --- */")
if shop_footer >= 0:
    drawer = page_styles.find("/* --- Cart drawer --- */", shop_footer)
    if drawer > shop_footer:
        page_styles = page_styles[:shop_footer] + page_styles[drawer:]

header = """/* v4.1 cart + checkout — shell from detail/products + page flow */

:root {
  --co-ink: #241f1b;
  --co-muted: rgba(36, 31, 27, 0.62);
  --co-copper: #8c4435;
  --co-copper-hover: #75382d;
  --co-cream: #faf6ee;
  --co-cream-deep: #f3ebe0;
  --co-border: rgba(36, 31, 27, 0.12);
  --co-input-bg: #fffdf8;
  --co-radius: 12px;
  --page-font: 'Benton Sans Wide', 'BentonSansWide', sans-serif;
  --display-font: 'Benton Sans Wide', 'BentonSansWide', sans-serif;
  --co-font: var(--page-font);
  --co-display: var(--display-font);
  --gutter-mobile: 1.25rem;
  --gutter-tablet: 2rem;
  --gutter-desktop: 2.5rem;
  --gutter: var(--gutter-mobile);
  --header-h: 92px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

@media (min-width: 768px) { :root { --gutter: var(--gutter-tablet); } }
@media (min-width: 1024px) { :root { --gutter: var(--gutter-desktop); } }

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  overflow-x: clip;
}

body.shop-flow,
body.products-b.shop-flow {
  background: var(--co-cream);
  color: var(--co-ink);
  font-family: var(--page-font);
  font-size: 1rem;
  line-height: 1.5;
}

body.shop-flow a { color: inherit; }

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

body.products-b.shop-flow .container,
body.products-b.shop-flow .container--full,
body.products-b.shop-flow .container--wide,
body.products-b.shop-flow .container--narrow {
  width: 100%;
  max-width: none !important;
  margin-inline: auto;
  padding-inline: var(--gutter) !important;
}

body.products-b.shop-flow .site-header .container {
  max-width: 1320px !important;
}

.crumbs__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  color: var(--co-muted);
}

.crumbs__list li + li::before {
  content: "/";
  margin-inline-end: 0.375rem;
  color: rgba(36, 31, 27, 0.45);
}

.crumbs__list a {
  color: var(--co-muted);
  text-decoration: none;
  border-bottom: 1px solid rgba(36, 31, 27, 0.25);
}

.crumbs__list a:hover {
  color: var(--co-ink);
  border-bottom-color: var(--co-ink);
}

.crumbs__list [aria-current="page"] {
  color: var(--co-copper);
  font-weight: 600;
}

.collection-head {
  padding-block: clamp(1.5rem, 3vw, 2.5rem) 0;
}

.collection-head__eyebrow {
  margin: 0 0 0.75rem;
  font-family: var(--co-display);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--co-copper);
}

.collection-head__title {
  margin: 0;
  font-family: var(--display-font);
  font-size: clamp(2.25rem, 4vw, 3.5rem);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #111;
}

.collection-head__em {
  font-style: normal;
  color: inherit;
}

.collection-head__intro {
  margin: 0.75rem 0 0;
  max-width: 52ch;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--co-muted);
}

.shop-main {
  padding-block: 0 clamp(3rem, 6vw, 5rem);
}

.footer-brand {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin-bottom: clamp(2rem, 4vw, 3rem);
  text-decoration: none;
}

.footer-brand__mark {
  height: 42px;
  width: auto;
  filter: brightness(0) invert(1);
}

.footer-brand__name {
  font-family: var(--co-display);
  font-size: 1rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #fff;
}

.footer-brand__since {
  font-size: 0.5rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

@media (max-width: 1024px) {
  .site-footer__cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .site-footer__cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .site-footer__legal { flex-direction: column; align-items: flex-start; }
}

"""

extra = """
.pay-opt--disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

.checkout-head-section .collection-head__intro { max-width: none; }
.cart-page-lede { margin-bottom: 1.5rem; }

.checkout-head .collection-head__title {
  margin: 0;
}

@media (max-width: 767px) {
  :root { --header-h: 56px; }
  body.products-b.shop-flow { --gutter: 1.25rem; }
  .collection-head__title { font-size: clamp(1.9rem, 8vw, 2.3rem); }
}
"""

out = header + "\n/* nav-light (detail.html) */\n" + nav + "\n" + footer + "\n" + page_styles + extra
(root / "checkout.css").write_text(out, encoding="utf-8")
print("wrote checkout.css", len(out))
