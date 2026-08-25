/* v4.1 shared search overlay — images, live filter, overlay inject */
(function () {
  "use strict";

  var IMG_BASE = "../v4-hover/";
  var SA_IMAGES = {
    "rose-01": IMG_BASE + "shaghaf-oud-ahmar.webp",
    "patchouli-01": IMG_BASE + "patchouli-01.webp",
    "vanilla-01": IMG_BASE + "shaghaf-silk.webp",
    "incense-01": IMG_BASE + "shaghaf-ember.webp",
    incense: IMG_BASE + "shaghaf-ember.webp",
    "shaghaf-oud-tonka": IMG_BASE + "shaghaf-oud-elixir.webp",
    tonka: IMG_BASE + "shaghaf-oud-elixir.webp",
    "shaghaf-amber": IMG_BASE + "shaghaf-amber-infusion.webp",
    gharaam: IMG_BASE + "shaghaf-tide.webp",
    "musk-07": IMG_BASE + "shaghaf-silk.webp",
    casablanca: IMG_BASE + "shaghaf-ink.webp",
    "shaghaf-oud": IMG_BASE + "shaghaf-oud-ahmar.webp"
  };

  var CATALOG = [
    { id: "rose-01", name: "Rose 01", name_ar: "روز ٠١", line: "Signature", line_ar: "سيجنتشر", notes: "Damask rose · Musk · Soft woods", notes_ar: "ورد دمشقي · مسك · أخشاب ناعمة", mood: "elegant dinner floral romantic woody rose", mood_ar: "أنيق عشاء زهري رومانسي ورد خشبي", href: "detail.html" },
    { id: "patchouli-01", name: "Patchouli 01", name_ar: "باتشولي ٠١", line: "Signature", line_ar: "سيجنتشر", notes: "Patchouli · Amber · Earth", notes_ar: "باتشولي · عنبر · تراب", mood: "warm earthy evening woody", mood_ar: "دافئ ترابي مسائي خشبي", href: "detail.html" },
    { id: "vanilla-01", name: "Vanilla 01", name_ar: "فانيلا ٠١", line: "Signature", line_ar: "سيجنتشر", notes: "Vanilla · Tonka · Soft woods", notes_ar: "فانيلا · تونكا · أخشاب ناعمة", mood: "sweet gourmand cozy vanilla", mood_ar: "حلو دافئ فانيلا", href: "detail.html" },
    { id: "shaghaf-oud-tonka", name: "Shaghaf Oud Tonka", name_ar: "شغف عود تونكا", line: "Shaghaf", line_ar: "شغف", notes: "Almond · Cinnamon · Tonka · Oud", notes_ar: "لوز · قرفة · تونكا · عود", mood: "elegant dinner woody warm spicy oud tonka", mood_ar: "أنيق عشاء خشبي دافئ حار عود تونكا", href: "detail.html" },
    { id: "incense-01", name: "Incense 01", name_ar: "بخور ٠١", line: "Incense", line_ar: "بخور", notes: "Frankincense · Myrrh · Smoke", notes_ar: "لبان · مر · دخان", mood: "ritual spiritual incense smoky woody", mood_ar: "طقسي روحي بخور دخان خشبي", href: "detail.html" },
    { id: "shaghaf-amber", name: "Shaghaf Amber Infusion", name_ar: "شغف أمبر إنفيوجن", line: "Shaghaf", line_ar: "شغف", notes: "Amber · Ginger · Vanilla", notes_ar: "عنبر · زنجبيل · فانيلا", mood: "elegant amber warm spicy woody", mood_ar: "أنيق عنبر دافئ حار خشبي", href: "detail.html" },
    { id: "gharaam", name: "Gharaam", name_ar: "غرام", line: "Love", line_ar: "حب", notes: "Rose · Oud · Saffron", notes_ar: "ورد · عود · زعفران", mood: "elegant romantic dinner floral oud love", mood_ar: "أنيق رومانسي عشاء زهري عود حب", href: "detail.html" },
    { id: "musk-07", name: "Musk 07", name_ar: "مسك ٠٧", line: "Signature", line_ar: "سيجنتشر", notes: "White musk · Soft florals", notes_ar: "مسك أبيض · ورود ناعمة", mood: "clean soft everyday floral musk", mood_ar: "نظيف ناعم يومي زهري مسك", href: "detail.html" },
    { id: "casablanca", name: "Casablanca", name_ar: "كازابلانكا", line: "Cities", line_ar: "مدن", notes: "Orange blossom · Jasmine · Woods", notes_ar: "زهر البرتقال · ياسمين · أخشاب", mood: "citrus floral travel fresh", mood_ar: "حمضي زهري سفر منعش", href: "detail.html" },
    { id: "shaghaf-oud", name: "Shaghaf Oud", name_ar: "شغف عود", line: "Shaghaf", line_ar: "شغف", notes: "Saffron · Rose · Oud", notes_ar: "زعفران · ورد · عود", mood: "elegant dinner oud woody classic saffron", mood_ar: "أنيق عشاء عود خشبي كلاسيكي زعفران", href: "detail.html" }
  ];

  var STOP = {
    i: 1, im: 1, "i'm": 1, looking: 1, for: 1, a: 1, an: 1, the: 1, to: 1, of: 1,
    and: 1, or: 1, with: 1, scent: 1, fragrance: 1, perfume: 1, something: 1,
    some: 1, my: 1, me: 1, want: 1, need: 1, like: 1, please: 1, that: 1, this: 1,
    in: 1, on: 1, at: 1, is: 1, it: 1, "أبحث": 1, "عن": 1, "عطر": 1, "في": 1,
    "من": 1, "هذا": 1, "هذه": 1, "او": 1, "أو": 1
  };

  var OVERLAY = '<div id="ai-search" class="ai-search" role="dialog" aria-modal="true" aria-label="Search" aria-hidden="true">' +
    '<div class="ai-search-scrim" data-close-search></div>' +
    '<div class="ai-search-dock">' +
    '<form class="ai-search-bar" id="ai-search-form" autocomplete="off" role="search">' +
    '<button type="button" class="ai-search-circle" id="ai-search-plus" aria-label="Close search" data-close-search>' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
    '</button>' +
    '<label class="visually-hidden" for="ai-search-input">Search scents</label>' +
    '<input id="ai-search-input" type="search" name="q" maxlength="140" placeholder="I\'m looking for a scent for an elegant dinner" data-i18n="search.ph" enterkeyhint="search" />' +
    '<button type="submit" class="ai-search-circle ai-search-send" aria-label="Search">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
    '</button>' +
    '</form>' +
    '<div class="ai-search-panel" id="ai-search-panel">' +
    '<p class="ai-search-kicker" data-i18n="search.hint">Try a note, a name, or a mood</p>' +
    '<ul class="ai-search-results" id="ai-search-results"></ul>' +
    '<p class="ai-search-empty" id="ai-search-empty" hidden data-i18n="search.empty">No matches</p>' +
    '</div></div></div>';

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function productImage(id, name) {
    if (window.__saCart && typeof window.__saCart.productImage === "function") {
      var fromCart = window.__saCart.productImage(id);
      if (fromCart) return fromCart;
    }
    if (SA_IMAGES[id]) return SA_IMAGES[id];
    if (name && SA_IMAGES[name]) return SA_IMAGES[name];
    return "";
  }

  function tokensOf(query) {
    return String(query || "")
      .trim()
      .toLowerCase()
      .split(/[\s,./·]+/)
      .filter(function (tok) {
        return tok && tok.length > 1 && !STOP[tok];
      });
  }

  function blobOf(p) {
    return [p.name, p.name_ar, p.line, p.line_ar, p.notes, p.notes_ar, p.mood, p.mood_ar, p.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function scoreProduct(p, tokens) {
    var blob = blobOf(p);
    var score = 0;
    for (var i = 0; i < tokens.length; i++) {
      if (blob.indexOf(tokens[i]) !== -1) score += 1;
    }
    return score;
  }

  function filterCatalog(query) {
    var tokens = tokensOf(query);
    if (!tokens.length) return CATALOG.slice();
    var andHits = [];
    var orHits = [];
    for (var i = 0; i < CATALOG.length; i++) {
      var score = scoreProduct(CATALOG[i], tokens);
      if (score === tokens.length) andHits.push(CATALOG[i]);
      else if (score > 0) orHits.push(CATALOG[i]);
    }
    return andHits.length ? andHits : orHits;
  }

  function render(query) {
    var results = document.getElementById("ai-search-results");
    var empty = document.getElementById("ai-search-empty");
    var kicker = document.querySelector(".ai-search-kicker");
    if (!results) return;
    var q = query || "";
    var ar = document.documentElement.dir === "rtl";
    var hits = filterCatalog(q);

    results.innerHTML = hits.map(function (p) {
      var name = ar && p.name_ar ? p.name_ar : p.name;
      var meta = ar && p.notes_ar ? p.notes_ar : p.notes;
      var src = productImage(p.id, p.name);
      var img = src
        ? '<img src="' + esc(src) + '" alt="" />'
        : '<img alt="" style="background:#efeae2" />';
      return '<li><a class="ai-search-hit" href="' + esc(p.href) + '" data-search-product="' + esc(p.name) + '">' +
        img + '<span class="ai-search-hit-copy"><p class="ai-search-hit-name">' + esc(name) + "</p>" +
        '<p class="ai-search-hit-meta">' + esc(meta) + "</p></span></a></li>";
    }).join("");

    if (empty) empty.hidden = hits.length > 0;
    if (kicker) kicker.hidden = Boolean(String(q).trim());
  }

  function ensureOverlay() {
    if (document.getElementById("ai-search")) return;
    if (!document.body) return;
    document.body.insertAdjacentHTML("beforeend", OVERLAY);
  }

  function openSearch() {
    ensureOverlay();
    var root = document.getElementById("ai-search");
    var input = document.getElementById("ai-search-input");
    var btn = document.getElementById("search-open");
    if (!root) return;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-search-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
    render(input && input.value || "");
    requestAnimationFrame(function () {
      if (input) input.focus();
    });
  }

  function closeSearch() {
    var root = document.getElementById("ai-search");
    var btn = document.getElementById("search-open");
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-search-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function toggleSearch() {
    var root = document.getElementById("ai-search");
    if (root && root.classList.contains("is-open")) closeSearch();
    else openSearch();
  }

  function bind() {
    if (window.__saSearchBound) return;
    window.__saSearchBound = true;
    ensureOverlay();

    var openBtn = document.getElementById("search-open");
    var root = document.getElementById("ai-search");
    var form = document.getElementById("ai-search-form");
    var input = document.getElementById("ai-search-input");

    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        toggleSearch();
      });
    }

    if (input) {
      input.addEventListener("input", function () {
        render(input.value);
      });
      input.addEventListener("focus", function () {
        if (root && !root.classList.contains("is-open")) openSearch();
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        render(input && input.value || "");
        var first = root && root.querySelector(".ai-search-hit");
        if (first) first.click();
      });
    }

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-close-search]")) {
        e.preventDefault();
        closeSearch();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root && root.classList.contains("is-open")) {
        closeSearch();
        if (input) input.blur();
      }
    });

    document.addEventListener("langchange", function () {
      if (root && root.classList.contains("is-open")) render(input && input.value || "");
    });
  }

  window.SASearch = {
    render: render,
    open: openSearch,
    close: closeSearch,
    toggle: toggleSearch,
    productImage: productImage,
    SA_IMAGES: SA_IMAGES,
    CATALOG: CATALOG
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
