/* v4.1 shared cart — sa_v4_cart localStorage
   Drawer markup/behavior matches products.html.
   Full-page bag on cart.html keeps its own .cline rows. */
(function () {
  "use strict";

  var KEY = "sa_v4_cart";
  var FREE = 250;
  var SHIP_FLAT = 25;
  var wasFree = null;

  var CATALOG = [
    { id: "rose-01", name: "Rose 01", name_ar: "روز ٠١", price: 68, meta: "Extrait · 50 ml", meta_ar: "إكستري · 50 مل" },
    { id: "patchouli-01", name: "Patchouli 01", name_ar: "باتشولي ٠١", price: 68, meta: "Extrait · 50 ml", meta_ar: "إكستري · 50 مل" },
    { id: "vanilla-01", name: "Vanilla 01", name_ar: "فانيلا ٠١", price: 68, meta: "Extrait · 50 ml", meta_ar: "إكستري · 50 مل" },
    { id: "shaghaf-oud-tonka", name: "Shaghaf Oud Tonka", name_ar: "شغف عود تونكا", price: 66, meta: "Extrait · 50 ml", meta_ar: "إكستري · 50 مل" },
    { id: "incense-01", name: "Incense 01", name_ar: "بخور ٠١", price: 68, meta: "Extrait · 50 ml", meta_ar: "إكستري · 50 مل" },
    { id: "shaghaf-amber", name: "Shaghaf Amber Infusion", name_ar: "شغف أمبر إنفيوجن", price: 66, meta: "Eau de Parfum · 75 ml", meta_ar: "أو دو بارفان · 75 مل" },
    { id: "gharaam", name: "Gharaam", name_ar: "غرام", price: 66, meta: "Eau de Parfum · 75 ml", meta_ar: "أو دو بارفان · 75 مل" },
    { id: "musk-07", name: "Musk 07", name_ar: "مسك ٠٧", price: 68, meta: "Extrait · 50 ml", meta_ar: "إكستري · 50 مل" },
    { id: "casablanca", name: "Casablanca", name_ar: "كازابلانكا", price: 66, meta: "Eau de Parfum · 75 ml", meta_ar: "أو دو بارفان · 75 مل" },
    { id: "shaghaf-oud", name: "Shaghaf Oud", name_ar: "شغف عود", price: 44, meta: "Eau de Parfum · 75 ml", meta_ar: "أو دو بارفان · 75 مل" }
  ];

  var COPY = {
    en: {
      title: function (n) { return n ? "My Bag (" + n + ")" : "My Bag"; },
      shipMore: function (a) { return "Spend " + a + " more for free shipping."; },
      shipFree: "You qualify for free shipping!",
      empty: "Your bag is empty.",
      shop: "Shop fragrances",
      remove: "Remove",
      total: "Total",
      checkout: "Checkout",
      view: "View full bag",
      recs: "You may also like",
      recAdd: "+ Add",
      shipFreeLabel: "Free",
      shipPaid: function (a) { return a; },
      items: function (n) { return n === 1 ? "1 item" : n + " items"; }
    },
    ar: {
      title: function (n) { return n ? "حقيبتي (" + n + ")" : "حقيبتي"; },
      shipMore: function (a) { return "أنفق " + a + " إضافية للشحن المجاني."; },
      shipFree: "تهانينا! حصلت على شحن مجاني",
      empty: "حقيبتك فارغة.",
      shop: "تسوق العطور",
      remove: "إزالة",
      total: "المجموع",
      checkout: "إتمام الشراء",
      view: "عرض الحقيبة كاملة",
      recs: "قد يعجبك أيضاً",
      recAdd: "+ أضف",
      shipFreeLabel: "مجاني",
      shipPaid: function (a) { return a; },
      items: function (n) { return n === 1 ? "منتج واحد" : n + " منتجات"; }
    }
  };

  var IMG_BASE = "../v4-hover/";
  var SA_IMAGES = {
    "rose-01": IMG_BASE + "shaghaf-oud-ahmar.webp",
    "patchouli-01": IMG_BASE + "patchouli-01.webp",
    "vanilla-01": IMG_BASE + "shaghaf-silk.webp",
    "incense-01": IMG_BASE + "shaghaf-ember.webp",
    "shaghaf-oud-tonka": IMG_BASE + "shaghaf-oud-elixir.webp",
    "shaghaf-amber": IMG_BASE + "shaghaf-amber-infusion.webp",
    "gharaam": IMG_BASE + "shaghaf-tide.webp",
    "musk-07": IMG_BASE + "shaghaf-silk.webp",
    "casablanca": IMG_BASE + "shaghaf-ink.webp",
    "shaghaf-oud": IMG_BASE + "shaghaf-oud-ahmar.webp"
  };

  function ar() {
    return document.documentElement.dir === "rtl";
  }

  function copy() {
    return ar() ? COPY.ar : COPY.en;
  }

  function money(n) {
    return "AED " + Number(n).toFixed(2);
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function byId(id) {
    for (var i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === id) return CATALOG[i];
    }
    return null;
  }

  function productImage(id) {
    return SA_IMAGES[id] || "";
  }

  function resolveImg(partial) {
    if (!partial) return "";
    var mapped = productImage(partial.id || "");
    if (mapped) return mapped;
    var raw = partial.img || "";
    if (raw && raw.indexOf("data:") !== 0) return raw;
    return "";
  }

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(raw) ? raw.filter(function (r) { return r && r.id && r.qty > 0; }) : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    render();
    try {
      window.dispatchEvent(new CustomEvent("sa-cart-change"));
    } catch (e2) {}
  }

  function count() {
    return read().reduce(function (s, r) { return s + r.qty; }, 0);
  }

  function total() {
    return read().reduce(function (s, r) { return s + (Number(r.price) || 0) * r.qty; }, 0);
  }

  function shipping(sub) {
    return sub >= FREE ? 0 : SHIP_FLAT;
  }

  function addItem(partial, qty) {
    qty = qty || 1;
    if (!partial || !partial.id) return;
    var img = resolveImg(partial);
    var items = read();
    var row = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === partial.id) { row = items[i]; break; }
    }
    if (row) {
      row.qty += qty;
      if (img) row.img = img;
    } else {
      items.push({
        id: partial.id,
        name: partial.name || partial.id,
        name_ar: partial.name_ar || "",
        price: Number(partial.price) || 0,
        meta: partial.meta || "",
        meta_ar: partial.meta_ar || "",
        img: img,
        qty: qty
      });
    }
    write(items);
  }

  function setQty(id, qty) {
    var items = read();
    if (qty < 1) items = items.filter(function (r) { return r.id !== id; });
    else {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          items[i].qty = qty;
          break;
        }
      }
    }
    write(items);
  }

  function recommended(limit) {
    limit = limit || 3;
    var inCart = {};
    read().forEach(function (r) { inCart[r.id] = 1; });
    var out = [];
    for (var i = 0; i < CATALOG.length && out.length < limit; i++) {
      if (!inCart[CATALOG[i].id]) out.push(CATALOG[i]);
    }
    return out;
  }

  function pageLineHtml(r, c, isAr) {
    var name = isAr && r.name_ar ? r.name_ar : r.name;
    var meta = isAr && r.meta_ar ? r.meta_ar : r.meta;
    var imgSrc = resolveImg(r);
    var img = imgSrc ? '<img src="' + esc(imgSrc) + '" alt="" />' : "";
    var lineTotal = money(r.price * r.qty);
    return (
      '<article class="cline" data-id="' + esc(r.id) + '">' +
      '<a class="cline__media" href="detail.html?id=' + esc(r.id) + '">' + img + "</a>" +
      '<div class="cline__body">' +
      '<div class="cline__row">' +
      '<h3><a href="detail.html?id=' + esc(r.id) + '">' + esc(name) + "</a></h3>" +
      '<span class="cline__price" dir="ltr">' + esc(lineTotal) + "</span></div>" +
      '<p class="cline__meta">' + esc(meta) + "</p>" +
      '<div class="cline__actions">' +
      '<span class="cline__qty">' +
      '<button type="button" data-cart-qty="' + esc(r.id) + '" data-delta="-1" aria-label="Decrease">−</button>' +
      '<span dir="ltr">' + r.qty + "</span>" +
      '<button type="button" data-cart-qty="' + esc(r.id) + '" data-delta="1" aria-label="Increase">+</button>' +
      "</span>" +
      '<button type="button" class="cline__remove" data-cart-remove="' + esc(r.id) + '">' + esc(c.remove) + "</button>" +
      "</div></div></article>"
    );
  }

  function renderBadges() {
    var n = count();
    document.querySelectorAll("[data-bag-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
      el.setAttribute("aria-hidden", n === 0 ? "true" : "false");
    });
    document.querySelectorAll("[data-bag-count-sr]").forEach(function (el) {
      el.textContent = String(n);
    });
  }

  function renderPageShipBar(bar, msgEl, fillEl, tot, c) {
    if (!bar || !msgEl || !fillEl) return;
    var rem = Math.max(0, FREE - tot);
    var pct = Math.min(100, (tot / FREE) * 100);
    var nowFree = rem <= 0 && tot > 0;
    if (!nowFree) {
      msgEl.textContent = tot === 0 ? "" : c.shipMore(money(rem));
      fillEl.style.width = pct + "%";
      bar.classList.remove("is-free");
    } else {
      msgEl.textContent = c.shipFree;
      fillEl.style.width = "100%";
      bar.classList.add("is-free");
    }
  }

  function fireWhoop(bar) {
    if (!bar) return;
    var panel = bar.closest(".cart-drawer-panel");
    var layer = (panel && panel.querySelector(".cart-confetti")) || document.getElementById("cart-confetti");
    bar.classList.remove("is-whoop");
    if (panel) panel.classList.remove("is-whoop-flash");
    void bar.offsetWidth;
    bar.classList.add("is-whoop");
    if (panel) panel.classList.add("is-whoop-flash");
    setTimeout(function () { if (panel) panel.classList.remove("is-whoop-flash"); }, 700);
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce || !layer) return;
    layer.innerHTML = "";
    var colors = ["#2f7d4a", "#3aa05a", "#c9a227", "#e0bd78", "#8c4435", "#fff", "#f4ead8"];
    var shapes = ["circle", "ribbon", "diamond"];
    var n = 58 + Math.floor(Math.random() * 19);
    var ox = 78, oy = 22;
    try {
      var br = bar.getBoundingClientRect();
      var lr = layer.getBoundingClientRect();
      if (br.width && lr.width) {
        ox = br.left - lr.left + br.width * 0.82;
        oy = br.top - lr.top + br.height * 0.72;
      }
    } catch (e2) {}
    for (var i = 0; i < n; i++) {
      var el = document.createElement("span");
      var shape = shapes[i % 3];
      el.className = "cart-confetti-piece is-" + shape;
      var size = 6 + Math.random() * 8;
      var rain = i % 4 === 0;
      el.style.setProperty("--x", rain ? (6 + Math.random() * 88) + "%" : ox + "px");
      el.style.setProperty("--y", rain ? (3 + Math.random() * 12) + "%" : oy + "px");
      el.style.setProperty("--w", (shape === "ribbon" ? size * 0.42 : size) + "px");
      el.style.setProperty("--h", (shape === "ribbon" ? size * 1.4 : size) + "px");
      el.style.setProperty("--c", colors[i % colors.length]);
      var ang = -Math.PI * 0.08 - Math.random() * Math.PI * 0.92;
      var dist = rain ? (90 + Math.random() * 170) : (48 + Math.random() * 190);
      el.style.setProperty("--dx", (Math.cos(ang) * dist + (Math.random() * 36 - 18)) + "px");
      el.style.setProperty("--dy", (Math.sin(ang) * dist + (rain ? 130 : 36)) + "px");
      el.style.setProperty("--r0", (Math.random() * 90 - 45) + "deg");
      el.style.setProperty("--r1", (140 + Math.random() * 300) + "deg");
      el.style.setProperty("--d", (Math.floor(i * 11)) + "ms");
      layer.appendChild(el);
    }
    setTimeout(function () { if (layer) layer.innerHTML = ""; }, 2100);
  }

  function renderDrawer() {
    var root = document.getElementById("cart-drawer");
    if (!root) return;
    var itemsEl = document.getElementById("cart-items");
    var recsEl = document.getElementById("cart-recs");
    var subEl = document.getElementById("cart-subtotal");
    var title = document.getElementById("cart-title");
    var shipMsg = document.getElementById("cart-ship-msg");
    var shipFill = document.getElementById("cart-ship-fill");
    var bar = document.getElementById("cart-ship-bar");
    var c = copy();
    var isAr = ar();
    var n = count();
    var tot = total();
    var items = read();

    if (title) title.textContent = c.title(n);
    if (subEl) subEl.textContent = money(tot);
    var totalLabel = document.getElementById("cart-total-label");
    if (totalLabel) totalLabel.textContent = c.total;

    var checkout = document.getElementById("cart-checkout");
    if (checkout) {
      checkout.textContent = c.checkout;
      checkout.disabled = n === 0;
    }

    var view = document.getElementById("cart-view-link");
    if (view) view.textContent = c.view;

    var recsTitle = document.getElementById("cart-recs-title");
    if (recsTitle) recsTitle.textContent = c.recs;

    if (shipMsg && shipFill) {
      var rem = Math.max(0, FREE - tot);
      var pct = Math.min(100, (tot / FREE) * 100);
      var nowFree = rem <= 0 && tot > 0;
      if (!nowFree) {
        shipMsg.textContent = tot === 0 ? "" : c.shipMore(money(rem));
        shipFill.style.width = pct + "%";
        if (bar) {
          bar.classList.remove("is-free");
          bar.classList.remove("is-whoop");
        }
        wasFree = false;
      } else {
        shipMsg.innerHTML = '<span class="ship-whoop-check" aria-hidden="true"></span><span class="ship-whoop-text">' + esc(c.shipFree) + "</span>";
        shipFill.style.width = "100%";
        if (bar) {
          bar.classList.add("is-free");
          if (wasFree === false) fireWhoop(bar);
        }
        wasFree = true;
      }
    }

    if (itemsEl) {
      if (!items.length) {
        itemsEl.innerHTML = '<div class="cart-empty"><p>' + esc(c.empty) + '</p><a href="products.html">' + esc(c.shop) + "</a></div>";
      } else {
        itemsEl.innerHTML = items.map(function (r) {
          var name = isAr && r.name_ar ? r.name_ar : r.name;
          var meta = isAr && r.meta_ar ? r.meta_ar : r.meta;
          var src = resolveImg(r);
          var img = src ? '<img src="' + esc(src) + '" alt="" />' : "";
          return '<article class="cart-line" data-id="' + esc(r.id) + '">' +
            '<div class="cart-line-img">' + img + "</div>" +
            '<div class="cart-line-info"><p class="cart-line-name">' + esc(name) + '</p><p class="cart-line-meta">' + esc(meta) + "</p>" +
            '<div class="cart-line-qty"><button type="button" data-cart-qty="' + esc(r.id) + '" data-delta="-1" aria-label="Decrease">−</button><span dir="ltr">' + r.qty + '</span><button type="button" data-cart-qty="' + esc(r.id) + '" data-delta="1" aria-label="Increase">+</button></div></div>' +
            '<div class="cart-line-side"><p class="cart-line-price" dir="ltr">' + esc(money(r.price * r.qty)) + '</p><button type="button" class="cart-line-remove" data-cart-remove="' + esc(r.id) + '">' + esc(c.remove) + "</button></div></article>";
        }).join("");
      }
    }

    if (recsEl) {
      recsEl.innerHTML = recommended(3).map(function (p) {
        var name = isAr && p.name_ar ? p.name_ar : p.name;
        var src = resolveImg(p);
        var img = src ? '<img src="' + esc(src) + '" alt="" />' : "<div></div>";
        return '<article class="cart-rec">' + img + "<div><p class=\"cart-rec-name\">" + esc(name) + '</p><p class="cart-rec-price" dir="ltr">' + esc(money(p.price)) + '</p></div><button type="button" class="cart-rec-add" data-cart-rec="' + esc(p.id) + '">' + esc(c.recAdd) + "</button></article>";
      }).join("");
    }
  }

  function renderPage() {
    var itemsRoot = document.getElementById("cart-page-items");
    if (!itemsRoot) return;

    var emptyRoot = document.getElementById("cart-page-empty");
    var layout = document.getElementById("cart-page-layout");
    var sumSub = document.getElementById("cart-sum-sub");
    var sumShip = document.getElementById("cart-sum-ship");
    var sumTot = document.getElementById("cart-sum-total");
    var countLabel = document.getElementById("cart-page-count");
    var pageCheckout = document.getElementById("cart-page-checkout");
    var c = copy();
    var isAr = ar();
    var items = read();
    var n = count();
    var sub = total();
    var ship = shipping(sub);

    if (countLabel) countLabel.textContent = c.items(n);
    if (sumSub) sumSub.textContent = money(sub);
    if (sumShip) sumShip.textContent = ship === 0 ? c.shipFreeLabel : money(ship);
    if (sumTot) sumTot.textContent = money(sub + ship);
    if (pageCheckout) {
      if (n === 0) pageCheckout.classList.add("is-disabled");
      else pageCheckout.classList.remove("is-disabled");
    }

    renderPageShipBar(
      document.getElementById("cart-page-ship"),
      document.getElementById("cart-page-ship-msg"),
      document.getElementById("cart-page-ship-fill"),
      sub,
      c
    );

    if (!items.length) {
      if (layout) layout.hidden = true;
      if (emptyRoot) emptyRoot.hidden = false;
      itemsRoot.innerHTML = "";
      return;
    }

    if (layout) layout.hidden = false;
    if (emptyRoot) emptyRoot.hidden = true;
    itemsRoot.innerHTML = items.map(function (r) { return pageLineHtml(r, c, isAr); }).join("");
  }

  function render() {
    renderBadges();
    renderDrawer();
    renderPage();
  }

  function openCart() {
    var root = document.getElementById("cart-drawer");
    if (!root) return;
    render();
    root.hidden = false;
    root.removeAttribute("hidden");
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-cart-open");
  }

  function closeCart() {
    var root = document.getElementById("cart-drawer");
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-cart-open");
  }

  function isBagBtn(el) {
    if (!el || !el.closest) return null;
    return el.closest('[data-open-cart], #cart-open, .icon-btn[aria-label="Bag"]');
  }

  function bindBagButtons() {
    document.querySelectorAll('.icon-btn[aria-label="Bag"], #cart-open, [data-open-cart]').forEach(function (btn) {
      btn.id = btn.id || "cart-open";
      btn.setAttribute("data-open-cart", "");
    });
  }

  function bindInteractions() {
    document.addEventListener("click", function (e) {
      var bagBtn = isBagBtn(e.target);
      if (bagBtn && !bagBtn.closest(".cart-drawer-panel")) {
        e.preventDefault();
        e.stopPropagation();
        openCart();
        return;
      }
      if (e.target.closest("[data-close-cart]") && !e.target.closest("[data-page]")) {
        closeCart();
        return;
      }
      if (e.target.closest("#cart-checkout")) {
        e.preventDefault();
        if (count() === 0) return;
        closeCart();
        location.href = "checkout.html";
        return;
      }
      if (e.target.closest("#cart-view-link, .cart-view-link")) {
        e.preventDefault();
        closeCart();
        location.href = "cart.html";
        return;
      }
      if (e.target.closest("#cart-page-checkout.is-disabled")) {
        e.preventDefault();
        return;
      }
      var qtyBtn = e.target.closest("[data-cart-qty]");
      if (qtyBtn) {
        var id = qtyBtn.getAttribute("data-cart-qty");
        var delta = parseInt(qtyBtn.getAttribute("data-delta"), 10) || 0;
        var row = read().find(function (r) { return r.id === id; });
        if (row) setQty(id, row.qty + delta);
        return;
      }
      var rm = e.target.closest("[data-cart-remove]");
      if (rm) {
        setQty(rm.getAttribute("data-cart-remove"), 0);
        return;
      }
      var rec = e.target.closest("[data-cart-rec]");
      if (rec) {
        var p = byId(rec.getAttribute("data-cart-rec"));
        if (p) addItem(p, 1);
      }
    }, true);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeCart();
    });

    window.addEventListener("storage", function (e) {
      if (e.key === KEY) render();
    });

    window.addEventListener("sa-cart-change", render);
  }

  function initLangToggle() {
    var html = document.documentElement;
    html.lang = "en";
    html.dir = "ltr";
    html.setAttribute("data-lang", "en");
    var btn = document.querySelector(".topbar__lang");
    if (!btn) return;
    btn.hidden = false;
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
    btn.tabIndex = -1;
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      html.lang = "en";
      html.dir = "ltr";
      html.setAttribute("data-lang", "en");
    }, true);
  }

  var bound = false;

  function init() {
    bindBagButtons();
    if (!bound) {
      bindInteractions();
      bound = true;
    }
    initLangToggle();
    render();
  }

  window.__saCart = {
    KEY: KEY,
    FREE: FREE,
    SHIP_FLAT: SHIP_FLAT,
    read: read,
    write: write,
    count: count,
    total: total,
    shipping: shipping,
    money: money,
    copy: copy,
    esc: esc,
    resolveImg: resolveImg,
    productImage: productImage,
    SA_IMAGES: SA_IMAGES,
    render: render,
    open: openCart,
    close: closeCart,
    add: addItem,
    setQty: setQty,
    clear: function () {
      write([]);
    }
  };

  document.addEventListener("sa:shell-ready", function () {
    init();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
