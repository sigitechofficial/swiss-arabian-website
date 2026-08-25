/* Phone filter sheet for v4 products. Moves the existing rail
   (does not clone [data-filter] controls). Desktop is untouched. */
(function () {
  "use strict";

  var mq = window.matchMedia("(max-width: 767px)");
  var lastFocus = null;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function isPhone() {
    return mq.matches;
  }

  function placeRail() {
    var rail = qs(".filters-rail");
    var slot = qs("[data-filter-sheet-body]");
    var catalog = qs(".catalog");
    var main = qs(".catalog__main");
    if (!rail || !slot || !catalog || !main) return;
    if (isPhone()) {
      if (rail.parentNode !== slot) slot.appendChild(rail);
    } else if (rail.parentNode === slot) {
      catalog.insertBefore(rail, main);
    }
  }

  function activeCount() {
    var n = 0;
    var f = qs("[data-filter][aria-pressed='true']");
    var c = qs("[data-filter-coll][aria-pressed='true']");
    var note = qs("[data-filter-note][aria-pressed='true']");
    if (f && f.getAttribute("data-filter") !== "all") n += 1;
    if (c && c.getAttribute("data-filter-coll") !== "all") n += 1;
    if (note && note.getAttribute("data-filter-note") !== "all") n += 1;
    var min = qs("[data-price-min]");
    var max = qs("[data-price-max]");
    if (min && parseInt(min.value, 10) > 1) n += 1;
    if (max && parseInt(max.value, 10) < 100) n += 1;
    return n;
  }

  function paintCount() {
    var badge = qs("[data-filter-count]");
    if (!badge) return;
    var n = activeCount();
    badge.textContent = n ? String(n) : "";
    badge.hidden = n === 0;
  }

  function setOpen(open) {
    var sheet = qs("[data-filter-sheet]");
    var btn = qs("[data-open-filters]");
    if (!sheet) return;
    var wasOpen = sheet.classList.contains("is-open");
    if (!open && !wasOpen) return;
    if (open) placeRail();
    sheet.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("is-filter-open", open);
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      lastFocus = document.activeElement;
      var panel = qs(".app-filter-sheet__panel", sheet);
      if (panel) panel.focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function clearFilters() {
    ["[data-filter='all']", "[data-filter-coll='all']", "[data-filter-note='all']"].forEach(function (sel) {
      var chip = qs(sel);
      if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
    });
    var min = qs("[data-price-min]");
    var max = qs("[data-price-max]");
    if (min) {
      min.value = "1";
      min.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (max) {
      max.value = "100";
      max.dispatchEvent(new Event("input", { bubbles: true }));
    }
    paintCount();
  }

  function onMq() {
    placeRail();
    if (!isPhone()) setOpen(false);
    paintCount();
  }

  function init() {
    var sheet = qs("[data-filter-sheet]");
    if (!sheet) return;

    placeRail();
    paintCount();

    var openBtn = qs("[data-open-filters]");
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        setOpen(true);
      });
    }

    var scrim = qs("[data-filter-scrim]");
    if (scrim) {
      scrim.addEventListener("click", function () {
        setOpen(false);
      });
    }

    var closeBtn = qs("[data-filter-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }

    var body = qs("[data-filter-sheet-body]", sheet);
    if (body) {
      /* Desktop rail traps wheel so the product grid stays still.
         Inside the sheet that preventDefault also kills body scroll. */
      body.addEventListener(
        "wheel",
        function (e) {
          e.stopImmediatePropagation();
        },
        { capture: true, passive: true }
      );
    }

    var apply = qs("[data-filter-apply]");
    if (apply) {
      apply.addEventListener("click", function () {
        setOpen(false);
      });
    }

    var clear = qs("[data-filter-clear]");
    if (clear) clear.addEventListener("click", clearFilters);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("is-open")) {
        e.preventDefault();
        setOpen(false);
      }
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-filter], [data-filter-coll], [data-filter-note]")) {
        requestAnimationFrame(paintCount);
      }
    });

    document.addEventListener("input", function (e) {
      if (e.target.matches && e.target.matches("[data-price-min], [data-price-max]")) {
        paintCount();
      }
    });

    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else mq.addListener(onMq);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Phone sort sheet for v4.1 products. Options mirror [data-sort] select;
   tap applies sort and closes the sheet. Desktop keeps native select. */
(function () {
  "use strict";

  var mq = window.matchMedia("(max-width: 767px)");
  var lastFocus = null;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function isPhone() {
    return mq.matches;
  }

  function paintOptions(sheet, sort) {
    var body = qs("[data-sort-sheet-body]", sheet);
    if (!body || !sort) return;

    var current = sort.value;
    qsa(".app-sort-sheet__option", body).forEach(function (btn) {
      var selected = btn.getAttribute("data-sort-value") === current;
      btn.setAttribute("aria-checked", selected ? "true" : "false");
      btn.tabIndex = selected ? 0 : -1;
    });
  }

  function buildOptions(sheet, sort) {
    var body = qs("[data-sort-sheet-body]", sheet);
    if (!body || !sort || body.childElementCount) return;

    var list = document.createElement("ul");
    list.className = "app-sort-sheet__list";

    Array.prototype.slice.call(sort.options).forEach(function (opt) {
      var item = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "app-sort-sheet__option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("data-sort-value", opt.value);
      btn.setAttribute("aria-checked", opt.selected ? "true" : "false");
      btn.tabIndex = opt.selected ? 0 : -1;

      var label = document.createElement("span");
      label.className = "app-sort-sheet__label";
      label.textContent = opt.textContent;

      var radio = document.createElement("span");
      radio.className = "app-sort-sheet__radio";
      radio.setAttribute("aria-hidden", "true");

      btn.appendChild(label);
      btn.appendChild(radio);
      item.appendChild(btn);
      list.appendChild(item);
    });

    body.appendChild(list);
  }

  function applySort(sort, value) {
    if (!sort || sort.value === value) return;
    sort.value = value;
    sort.dispatchEvent(new Event("change", { bubbles: true }));
    sort.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function setOpen(open) {
    var sheet = qs("[data-sort-sheet]");
    var btn = qs("[data-open-sort]");
    var sort = qs("[data-sort]");
    if (!sheet) return;
    var wasOpen = sheet.classList.contains("is-open");
    if (!open && !wasOpen) return;

    if (open) {
      buildOptions(sheet, sort);
      paintOptions(sheet, sort);
    }

    sheet.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("is-sort-open", open);
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      lastFocus = document.activeElement;
      var panel = qs(".app-sort-sheet__panel", sheet);
      if (panel) panel.focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function onOptionClick(e) {
    var btn = e.target.closest(".app-sort-sheet__option");
    if (!btn) return;
    var sort = qs("[data-sort]");
    applySort(sort, btn.getAttribute("data-sort-value"));
    paintOptions(qs("[data-sort-sheet]"), sort);
    setOpen(false);
  }

  function onOptionKeydown(e) {
    var btn = e.target.closest(".app-sort-sheet__option");
    if (!btn || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    var options = qsa(".app-sort-sheet__option", qs("[data-sort-sheet]"));
    var idx = options.indexOf(btn);
    if (idx < 0) return;
    var next = e.key === "ArrowDown" ? options[idx + 1] : options[idx - 1];
    if (next) next.focus();
  }

  function onMq() {
    if (!isPhone()) setOpen(false);
  }

  function init() {
    var sheet = qs("[data-sort-sheet]");
    if (!sheet) return;

    var openBtn = qs("[data-open-sort]");
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        setOpen(true);
      });
    }

    var scrim = qs("[data-sort-scrim]");
    if (scrim) {
      scrim.addEventListener("click", function () {
        setOpen(false);
      });
    }

    var closeBtn = qs("[data-sort-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }

    var body = qs("[data-sort-sheet-body]", sheet);
    if (body) {
      body.addEventListener("click", onOptionClick);
      body.addEventListener("keydown", onOptionKeydown);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("is-open")) {
        e.preventDefault();
        setOpen(false);
      }
    });

    var sort = qs("[data-sort]");
    if (sort) {
      sort.addEventListener("change", function () {
        paintOptions(sheet, sort);
      });
    }

    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else mq.addListener(onMq);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
