from pathlib import Path

ROOT = Path(r"E:\claude-project-swiss\claude\v4.1")
FILES = ["landing.html", "products.html", "detail.html"]

OLD_FOOT = """      <button type="button" class="cart-checkout" id="cart-checkout" data-i18n="cart.checkout">Checkout</button>
    </footer>"""

NEW_FOOT = """      <button type="button" class="cart-checkout" id="cart-checkout" data-i18n="cart.checkout">Checkout</button>
      <a class="cart-view-link" id="cart-view-link" href="cart.html" data-page="cart">View full bag</a>
    </footer>"""

OLD_CHECKOUT = """      if(e.target.closest("#cart-checkout, #cart-page-checkout")){
        var c=copy();
        alert(c.saved);
      }"""

NEW_CHECKOUT = """      if(e.target.closest("#cart-checkout, #cart-page-checkout")){
        e.preventDefault();
        if(count()===0) return;
        closeCart();
        location.href="checkout.html";
        return;
      }
      if(e.target.closest("#cart-view-link, .cart-view-link")){
        e.preventDefault();
        closeCart();
        location.href="cart.html";
        return;
      }"""

OLD_GO = """    else if(page==="detail") location.href="detail.html";
  }"""

NEW_GO = """    else if(page==="detail") location.href="detail.html";
    else if(page==="cart") location.href="cart.html";
  }"""

for name in FILES:
    path = ROOT / name
    text = path.read_text(encoding="utf-8")
    orig = text
    if OLD_FOOT not in text:
        raise SystemExit(f"missing footer in {name}")
    if OLD_CHECKOUT not in text:
        raise SystemExit(f"missing checkout handler in {name}")
    if OLD_GO not in text:
        raise SystemExit(f"missing go() tail in {name}")
    text = text.replace(OLD_FOOT, NEW_FOOT, 1)
    text = text.replace(OLD_CHECKOUT, NEW_CHECKOUT, 1)
    text = text.replace(OLD_GO, NEW_GO, 1)
    path.write_text(text, encoding="utf-8", newline="\n")
    print("patched", name, len(text) - len(orig), "bytes delta")

print("done")
