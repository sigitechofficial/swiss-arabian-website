"""Rebuild cart.html + checkout.html shell from detail.html (matches products)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
DETAIL = (ROOT / "detail.html").read_text(encoding="utf-8")

def slice_between(text: str, start: str, end: str) -> str:
    s = text.find(start)
    if s < 0:
        raise SystemExit(f"missing start: {start!r}")
    e = text.find(end, s)
    if e < 0:
        raise SystemExit(f"missing end: {end!r}")
    return text[s : e + len(end)]

HEADER = slice_between(DETAIL, '<header class="site-header">', "</header>")
FOOTER = slice_between(DETAIL, '<footer class="site-footer">', "</footer>")

nav_script = re.search(
    r"<script>\s*/\* =+\s*\n\s*nav-light\.js[\s\S]*?\}\)\(\);\s*\n",
    DETAIL,
)
if not nav_script:
    raise SystemExit("nav-light script not found")
NAV_LIGHT_JS = nav_script.group(0).strip() + "\n</script>"

MOBILE_NAV_JS = """<script>
(function () {
  "use strict";
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function initMobileNav() {
    var toggle = qs(".nav-toggle");
    var drawer = qs("#mobile-nav");
    if (!toggle || !drawer) return;
    var label = qs(".visually-hidden", toggle);
    function setOpen(open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.hidden = !open;
      if (label) label.textContent = open ? "Close menu" : "Open menu";
      if (!open && returnFocus) toggle.focus();
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true", false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false, true);
    });
    qsa("a", drawer).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false, false); });
    });
    window.matchMedia("(min-width: 1280px)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false, false);
    });
    setOpen(false, false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMobileNav);
  else initMobileNav();
})();
</script>"""

# Drawer comes from partials/cart-drawer.html via shell.js — do not embed a second one.
CART_DRAWER = ""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  {meta}
  <link rel="stylesheet" href="app.css">
  <link rel="stylesheet" href="checkout.css">
</head>
<body class="products-b shop-flow">
  <a class="skip-link visually-hidden" href="#main">Skip to content</a>
"""

TAIL = """
  {nav_light}
  {mobile_nav}
  <script src="cart.js"></script>
  {extra_scripts}
</body>
</html>
"""

def cart_main():
    return """
  <main id="main" class="shop-main">
    <section class="collection-head" aria-labelledby="cart-heading">
      <div class="container container--full">
        <nav class="crumbs" aria-label="Breadcrumb">
          <ol class="crumbs__list" role="list">
            <li><a href="landing.html">Home</a></li>
            <li aria-current="page">Bag</li>
          </ol>
        </nav>
        <header class="cart-page-head">
          <p class="collection-head__eyebrow">Your bag · <span id="cart-page-count">0 items</span></p>
          <h1 class="collection-head__title" id="cart-heading">The <em class="collection-head__em">bag.</em></h1>
          <p class="collection-head__intro cart-page-lede">Review your selections before checkout. Free samples arrive with every order — chosen to match your notes.</p>
        </header>

        <div class="cart-ship-banner" id="cart-page-ship" aria-live="polite">
          <p id="cart-page-ship-msg"></p>
          <div class="cart-ship-track"><div class="cart-ship-fill" id="cart-page-ship-fill"></div></div>
        </div>

        <div class="cart-layout" id="cart-page-layout">
          <div class="cart-items-col" id="cart-page-items" aria-live="polite"></div>
          <aside class="cart-summary" aria-label="Order summary">
            <h2>Summary</h2>
            <dl class="cart-totals">
              <div><dt>Subtotal</dt><dd id="cart-sum-sub" dir="ltr">AED 0</dd></div>
              <div><dt>Shipping</dt><dd id="cart-sum-ship">Calculated below</dd></div>
              <div class="cart-totals-line"><dt>Total</dt><dd id="cart-sum-total" dir="ltr">AED 0</dd></div>
            </dl>
            <a class="cart-cta" href="checkout.html" id="cart-page-checkout">
              <span>Proceed to checkout</span>
              <b class="arrow" aria-hidden="true">↗</b>
            </a>
            <a class="btn-secondary cart-continue" href="products.html">Continue shopping</a>
            <p class="cart-hint">Complimentary shipping on orders over <strong>AED 250</strong>.</p>
            <p class="cart-hint">30-day fragrance guarantee. Returns are on us.</p>
            <div class="cart-badges">
              <span>SSL Secured</span>
              <i aria-hidden="true">·</i>
              <span>Ships from Sharjah</span>
            </div>
          </aside>
        </div>

        <section class="cart-empty-state" id="cart-page-empty" hidden>
          <p class="collection-head__eyebrow">Nothing yet</p>
          <h2 class="collection-head__title">Your bag is <em class="collection-head__em">empty.</em></h2>
          <p class="collection-head__intro">Every scent is composed in small lots. Start with a signature.</p>
          <a class="cart-cta cart-cta--inline" href="products.html">
            <span>Explore the collection</span>
            <b class="arrow" aria-hidden="true">↗</b>
          </a>
        </section>
      </div>
    </section>
  </main>
"""

def checkout_main():
    return """
  <main id="main" class="shop-main checkout-main">
    <section class="collection-head checkout-head-section" aria-labelledby="checkout-heading">
      <div class="container container--full">
        <nav class="crumbs" aria-label="Breadcrumb">
          <ol class="crumbs__list" role="list">
            <li><a href="landing.html">Home</a></li>
            <li><a href="cart.html">Bag</a></li>
            <li aria-current="page">Checkout</li>
          </ol>
        </nav>

        <header class="checkout-head">
          <h1 class="collection-head__title" id="checkout-heading">Checkout</h1>
          <ol class="checkout-steps">
            <li><a href="cart.html">Bag</a></li>
            <li aria-hidden="true">·</li>
            <li class="is-current">Details &amp; payment</li>
          </ol>
        </header>

        <button type="button" class="checkout-summary-toggle" id="summary-toggle" aria-expanded="false" aria-controls="checkout-summary">
          <span>Order summary</span>
          <span id="summary-toggle-total" dir="ltr">AED 0</span>
        </button>

        <div class="checkout-layout" id="checkout-layout">
          <form class="checkout-form" id="checkout-form" novalidate>
            <section class="cbox">
              <header class="cbox__head">
                <span class="cbox__num">01</span>
                <h2>Delivery</h2>
              </header>
              <div class="cbox__grid">
                <label class="fld fld--full">
                  <span>Full name</span>
                  <input type="text" name="delName" required autocomplete="name" placeholder="First and last name">
                </label>
                <label class="fld fld--full">
                  <span>Phone</span>
                  <input type="tel" name="delPhone" required autocomplete="tel" placeholder="+971 50 000 0000">
                </label>
                <label class="fld fld--full">
                  <span>Address line 1</span>
                  <input type="text" name="delAddr1" required autocomplete="address-line1" placeholder="Street and building">
                </label>
                <label class="fld fld--full">
                  <span>Address line 2 <span class="fld__hint">(optional)</span></span>
                  <input type="text" name="delAddr2" autocomplete="address-line2" placeholder="Apartment, suite, floor">
                </label>
                <label class="fld">
                  <span>City</span>
                  <input type="text" name="delCity" required autocomplete="address-level2">
                </label>
                <label class="fld">
                  <span>Emirate</span>
                  <div class="fld__select">
                    <select name="delEmirate" required autocomplete="address-level1">
                      <option value="">Select emirate</option>
                      <option>Dubai</option>
                      <option>Abu Dhabi</option>
                      <option>Sharjah</option>
                      <option>Ajman</option>
                      <option>Umm Al Quwain</option>
                      <option>Ras Al Khaimah</option>
                      <option>Fujairah</option>
                    </select>
                    <b aria-hidden="true">▾</b>
                  </div>
                </label>
                <label class="fld fld--full">
                  <span>Postal code <span class="fld__hint">(optional)</span></span>
                  <input type="text" name="delPostal" autocomplete="postal-code" inputmode="numeric">
                </label>
              </div>
            </section>

            <section class="cbox">
              <header class="cbox__head">
                <span class="cbox__num">02</span>
                <h2>Billing information</h2>
              </header>
              <div class="cbox__body">
                <label class="fld fld--check fld--full">
                  <input type="checkbox" id="billing-same" name="billingSame" checked>
                  <span>Same as delivery address</span>
                </label>
                <div class="cbox__grid" id="billing-fields" hidden>
                  <label class="fld fld--full">
                    <span>Billing name</span>
                    <input type="text" name="billName" autocomplete="billing name">
                  </label>
                  <label class="fld fld--full">
                    <span>Billing address line 1</span>
                    <input type="text" name="billAddr1" autocomplete="billing address-line1">
                  </label>
                  <label class="fld fld--full">
                    <span>Billing address line 2 <span class="fld__hint">(optional)</span></span>
                    <input type="text" name="billAddr2" autocomplete="billing address-line2">
                  </label>
                  <label class="fld">
                    <span>City</span>
                    <input type="text" name="billCity" autocomplete="billing address-level2">
                  </label>
                  <label class="fld">
                    <span>Emirate</span>
                    <div class="fld__select">
                      <select name="billEmirate" autocomplete="billing address-level1">
                        <option value="">Select emirate</option>
                        <option>Dubai</option>
                        <option>Abu Dhabi</option>
                        <option>Sharjah</option>
                        <option>Ajman</option>
                        <option>Umm Al Quwain</option>
                        <option>Ras Al Khaimah</option>
                        <option>Fujairah</option>
                      </select>
                      <b aria-hidden="true">▾</b>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section class="cbox">
              <header class="cbox__head">
                <span class="cbox__num">03</span>
                <h2>Payment method</h2>
              </header>
              <div class="pay-options" role="radiogroup" aria-label="Payment methods">
                <label class="pay-opt is-active">
                  <input type="radio" name="payMethod" value="card" checked>
                  <span>
                    <span class="pay-opt__title">Credit / debit card</span>
                    <span class="pay-opt__note">Visa, Mastercard, Amex</span>
                  </span>
                </label>
                <label class="pay-opt pay-opt--disabled">
                  <input type="radio" name="payMethod" value="tabby" disabled>
                  <span>
                    <span class="pay-opt__title">Tabby</span>
                    <span class="pay-opt__note">Pay in 4 · interest-free</span>
                  </span>
                  <span class="pay-opt__badge">Coming soon</span>
                </label>
                <label class="pay-opt pay-opt--disabled">
                  <input type="radio" name="payMethod" value="tamara" disabled>
                  <span>
                    <span class="pay-opt__title">Tamara</span>
                    <span class="pay-opt__note">Split payments</span>
                  </span>
                  <span class="pay-opt__badge">Coming soon</span>
                </label>
              </div>
              <div class="cbox__grid card-fields" id="card-fields">
                <label class="fld fld--full">
                  <span>Card number</span>
                  <input type="text" name="card" inputmode="numeric" placeholder="1234  5678  9012  3456" autocomplete="cc-number">
                </label>
                <label class="fld">
                  <span>Expiry</span>
                  <input type="text" name="exp" placeholder="MM / YY" autocomplete="cc-exp">
                </label>
                <label class="fld">
                  <span>CVC</span>
                  <input type="text" name="cvc" inputmode="numeric" placeholder="•••" autocomplete="cc-csc">
                </label>
                <label class="fld fld--full">
                  <span>Name on card</span>
                  <input type="text" name="cardName" autocomplete="cc-name">
                </label>
              </div>
            </section>

            <button type="submit" class="checkout-cta" id="place-order">
              <span>Place order</span>
              <b class="arrow" aria-hidden="true">↗</b>
            </button>
            <p class="checkout-legal">By placing this order you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>. Payment is encrypted.</p>
          </form>

          <aside class="checkout-summary" id="checkout-summary" aria-label="Order summary">
            <h2>Your order</h2>
            <div class="checkout-lines" id="checkout-lines"></div>
            <dl class="checkout-totals">
              <div><dt>Subtotal</dt><dd id="co-sub" dir="ltr">AED 0</dd></div>
              <div><dt>Shipping</dt><dd id="co-ship">Free</dd></div>
              <div class="checkout-totals-line"><dt>Total</dt><dd id="co-total" dir="ltr">AED 0</dd></div>
            </dl>
            <p class="checkout-badges">SSL Encrypted · 30-day guarantee · Ships from Sharjah</p>
          </aside>
        </div>

        <section class="checkout-done" id="checkout-done" hidden>
          <p class="collection-head__eyebrow">Order confirmed</p>
          <h1 class="collection-head__title">Thank you, <em class="collection-head__em" id="done-name">friend</em>.</h1>
          <p class="collection-head__intro">Your order <strong id="done-order">#SA-000000</strong> is being prepared in Sharjah. A confirmation will land in your inbox within minutes.</p>
          <a class="checkout-cta checkout-cta--inline" href="landing.html">
            <span>Return home</span>
            <b class="arrow" aria-hidden="true">↗</b>
          </a>
        </section>

        <section class="checkout-empty" id="checkout-empty" hidden>
          <p class="collection-head__eyebrow">Empty bag</p>
          <h2 class="collection-head__title">Nothing to check out yet.</h2>
          <a class="checkout-cta checkout-cta--inline" href="products.html">
            <span>Explore the collection</span>
            <b class="arrow" aria-hidden="true">↗</b>
          </a>
        </section>
      </div>
    </section>
  </main>
"""

cart_html = (
    HEAD.format(meta='<title>Your Bag · Swiss Arabian</title>\n  <meta name="description" content="Review your Swiss Arabian selections before checkout.">')
    + HEADER
    + cart_main()
    + FOOTER
    + '<script src="shell.js"></script>\n'
    + CART_DRAWER
    + TAIL.format(nav_light=NAV_LIGHT_JS, mobile_nav=MOBILE_NAV_JS, extra_scripts="")
)

checkout_html = (
    HEAD.format(meta='<title>Checkout · Swiss Arabian</title>\n  <meta name="description" content="Complete your Swiss Arabian order.">')
    + HEADER
    + checkout_main()
    + FOOTER
    + '<script src="shell.js"></script>\n'
    + CART_DRAWER
    + TAIL.format(nav_light=NAV_LIGHT_JS, mobile_nav=MOBILE_NAV_JS, extra_scripts='  <script src="checkout.js"></script>\n')
)

(ROOT / "cart.html").write_text(cart_html, encoding="utf-8", newline="\n")
(ROOT / "checkout.html").write_text(checkout_html, encoding="utf-8", newline="\n")
print("wrote cart.html", len(cart_html))
print("wrote checkout.html", len(checkout_html))
