/* v4.1 checkout — order summary + delivery/billing/payment (v1-quality prototype) */
(function () {
  "use strict";

  var cart = window.__saCart;
  if (!cart) return;

  var layout = document.getElementById("checkout-layout");
  var emptyEl = document.getElementById("checkout-empty");
  var doneEl = document.getElementById("checkout-done");
  var form = document.getElementById("checkout-form");
  var billingWrap = document.getElementById("billing-fields");
  var sameCheckbox = document.getElementById("billing-same");
  var cardFields = document.getElementById("card-fields");
  var payMockNote = document.getElementById("pay-mock-note");
  var summaryToggle = document.getElementById("summary-toggle");
  var summaryPanel = document.getElementById("checkout-summary");
  var summaryToggleTotal = document.getElementById("summary-toggle-total");

  var billingRequired = ["billName", "billAddr1", "billCity", "billEmirate"];
  var cardRequired = ["card", "exp", "cvc", "cardName"];

  function shippingCost(sub) {
    return cart.shipping(sub);
  }

  function renderSummary() {
    var linesEl = document.getElementById("checkout-lines");
    var subEl = document.getElementById("co-sub");
    var shipEl = document.getElementById("co-ship");
    var totalEl = document.getElementById("co-total");
    if (!linesEl) return;

    var items = cart.read();
    var c = cart.copy();
    var isAr = document.documentElement.dir === "rtl";

    if (!items.length) {
      if (layout) layout.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      if (doneEl) doneEl.hidden = true;
      if (summaryToggle) summaryToggle.hidden = true;
      return;
    }

    if (layout) layout.hidden = false;
    if (emptyEl) emptyEl.hidden = true;
    if (doneEl) doneEl.hidden = true;
    if (summaryToggle) summaryToggle.hidden = false;

    linesEl.innerHTML = items
      .map(function (r) {
        var name = isAr && r.name_ar ? r.name_ar : r.name;
        var meta = isAr && r.meta_ar ? r.meta_ar : r.meta;
        var imgSrc = cart.resolveImg(r);
        var img = imgSrc ? '<img src="' + cart.esc(imgSrc) + '" alt="" />' : "";
        return (
          '<article class="coline">' +
          '<div class="coline__media">' + img + "<b>" + r.qty + "</b></div>" +
          '<div class="coline__body"><h3>' + cart.esc(name) + "</h3><p>" + cart.esc(meta) + "</p></div>" +
          '<span class="coline__price" dir="ltr">' + cart.esc(cart.money(r.price * r.qty)) + "</span></article>"
        );
      })
      .join("");

    var sub = cart.total();
    var ship = shippingCost(sub);
    var grand = sub + ship;
    if (subEl) subEl.textContent = cart.money(sub);
    if (shipEl) shipEl.textContent = ship === 0 ? c.shipFreeLabel : cart.money(ship);
    if (totalEl) totalEl.textContent = cart.money(grand);
    if (summaryToggleTotal) summaryToggleTotal.textContent = cart.money(grand);
  }

  function toggleBilling() {
    if (!billingWrap || !sameCheckbox) return;
    var same = sameCheckbox.checked;
    billingWrap.hidden = same;
    billingWrap.querySelectorAll("input, select").forEach(function (el) {
      el.disabled = same;
      if (same) el.classList.remove("is-err");
    });
    billingRequired.forEach(function (name) {
      var el = form && form.elements[name];
      if (el) el.required = !same;
    });
  }

  function togglePayment() {
    if (!form) return;
    var method = form.querySelector('input[name="payMethod"]:checked');
    var isCard = !method || method.value === "card";
    document.querySelectorAll(".pay-opt").forEach(function (el) {
      el.classList.toggle("is-active", el.querySelector("input") === method);
    });
    if (cardFields) cardFields.hidden = !isCard;
    if (payMockNote) payMockNote.hidden = isCard;
    cardRequired.forEach(function (name) {
      var el = form.elements[name];
      if (el) el.required = isCard;
    });
  }

  function validateForm() {
    if (!form) return false;
    var invalid = null;
    form.querySelectorAll(":invalid").forEach(function (el) {
      el.classList.remove("is-err");
    });
    form.querySelectorAll("input, select").forEach(function (el) {
      if (el.disabled) return;
      if (!el.checkValidity()) {
        el.classList.add("is-err");
        if (!invalid) invalid = el;
      }
    });
    if (invalid) {
      invalid.focus();
      return false;
    }
    return true;
  }

  function onSubmit(e) {
    e.preventDefault();
    var method = form.querySelector('input[name="payMethod"]:checked');
    if (method && method.value !== "card") {
      if (payMockNote) {
        payMockNote.hidden = false;
        payMockNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }
    if (!validateForm()) return;

    var fullName = (form.elements.delName && form.elements.delName.value.trim()) || "";
    var firstName = fullName || "friend";
    var orderNo = "SA-" + Math.floor(100000 + Math.random() * 900000);

    cart.clear();

    if (layout) layout.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    if (summaryToggle) summaryToggle.hidden = true;
    if (doneEl) {
      doneEl.hidden = false;
      var nameEl = document.getElementById("done-name");
      var orderEl = document.getElementById("done-order");
      if (nameEl) nameEl.textContent = firstName.split(" ")[0] || firstName;
      if (orderEl) orderEl.textContent = "#" + orderNo;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function initSummaryToggle() {
    if (!summaryToggle || !summaryPanel) return;
    summaryToggle.addEventListener("click", function () {
      var open = summaryPanel.classList.toggle("is-open");
      summaryToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function init() {
    renderSummary();
    toggleBilling();
    togglePayment();
    initSummaryToggle();

    if (sameCheckbox) {
      sameCheckbox.addEventListener("change", toggleBilling);
    }

    if (form) {
      form.addEventListener("submit", onSubmit);
      form.querySelectorAll('input[name="payMethod"]').forEach(function (r) {
        r.addEventListener("change", togglePayment);
      });
    }

    window.addEventListener("sa-cart-change", renderSummary);
    window.addEventListener("storage", function (e) {
      if (e.key === cart.KEY) renderSummary();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
