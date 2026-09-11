"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listCustomerAddresses } from "@/features/account/api/customerAccount.service";
import { CheckoutAddonRow, MissThisSwiper } from "@/features/cart/components/MissThisSwiper";
import { COMPLIMENTARY_SAMPLES } from "@/features/cart/constants/complimentarySamples";
import { addItemOptimistic } from "@/features/cart/api/optimisticCart";
import {
  CATALOG_PRODUCTS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useCheckout } from "../hooks/useCheckout";
import type { AddressFields } from "../utils/addressSnapshot";
import { checkoutWarningMessages } from "../utils/checkoutIssues";
import {
  deliveryEta,
  deliveryFeeLabel,
  isStripePaymentMethod,
  paymentMethodNote,
} from "../utils/methodLabels";

/** Matches the `v5/checkout.html` prototype's free-shipping threshold. */
const FREE_SHIPPING_THRESHOLD = 250;

/** Prefer the static catalog image for known slugs (stale persisted paths). */
function lineImageUrl(slug: string, fallback?: string) {
  return CATALOG_PRODUCTS.find((p) => p.slug === slug)?.imageUrl ?? fallback;
}

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

const EMPTY_ADDRESS: AddressFields = {
  fullName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  emirate: "",
  postalCode: "",
};

function matchEmirate(value?: string | null): string {
  if (!value) return "";
  const needle = value.trim().toLowerCase();
  return EMIRATES.find((e) => e.toLowerCase() === needle) ?? "";
}

export function CheckoutPageView() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const cartSubtotal = useCartStore((s) => s.subtotal());
  const cartCurrency = useCartStore((s) => s.totals?.currency);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkout = useCheckout();

  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState<AddressFields>(EMPTY_ADDRESS);
  const [billing, setBilling] = useState<AddressFields>(EMPTY_ADDRESS);
  const [billingSame, setBillingSame] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data: savedAddresses } = useQuery({
    queryKey: ["checkout", "saved-addresses", user?.id ?? "guest"],
    queryFn: listCustomerAddresses,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const defaultAddress =
    savedAddresses?.find((a) => a.isDefaultShipping) ?? savedAddresses?.[0];

  // Prefill from the signed-in profile and default address, once per
  // combination — during render rather than in an effect, and never over
  // anything the shopper has already typed.
  const prefillKey = user ? `${user.id}:${defaultAddress?.id ?? "none"}` : null;
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (user && prefillKey && prefillKey !== prefilledFor) {
    setPrefilledFor(prefillKey);
    const profileEmail = user.email.includes("@") ? user.email : "";
    const savedName =
      defaultAddress?.fullName ||
      [defaultAddress?.firstName, defaultAddress?.lastName].filter(Boolean).join(" ");
    setEmail((prev) => prev || profileEmail);
    setShipping((prev) => ({
      fullName: prev.fullName || savedName || user.fullName || "",
      phone: prev.phone || defaultAddress?.phoneE164 || user.phoneE164 || "",
      address1: prev.address1 || defaultAddress?.address1 || "",
      address2: prev.address2 || defaultAddress?.address2 || "",
      city: prev.city || defaultAddress?.city || "",
      emirate: prev.emirate || matchEmirate(defaultAddress?.province),
      postalCode: prev.postalCode || defaultAddress?.postalCode || "",
    }));
  }

  const visibleLines = hydrated ? lines : [];
  // Only API-backed lines are part of the checkout session. Local-only lines
  // (static catalogue items with no SKU) would never reach the order.
  const orderableLines = visibleLines.filter((line) => line.cartItemId);
  const leftOutCount = visibleLines.length - orderableLines.length;

  // Always show the "Don't miss this" and add-on picks. Only products with a
  // live SKU or variant can join the checkout session, so the rest stay visible
  // with a disabled add button — never added locally and silently left out.
  const inCart = new Set(visibleLines.map((l) => l.slug).filter(Boolean));
  const upsells = CATALOG_PRODUCTS.filter((p) => !inCart.has(p.slug));
  const canAddToOrder = (p: CatalogProduct) => Boolean(p.sku || p.variantId);
  const addOns = upsells.slice(0, 3);
  const missThis = upsells.slice(0, 4);

  const session = checkout.session;
  const estimate = session?.totalsEstimate;
  const currency = session?.currency ?? cartCurrency ?? "AED";
  const subtotal = estimate ? Number(estimate.subtotal) : cartSubtotal;
  const shippingFee = estimate ? Number(estimate.shipping) : 0;
  const discount = estimate ? Number(estimate.discount) : 0;
  const tax = estimate ? Number(estimate.tax) : 0;
  const total = estimate ? Number(estimate.total) : cartSubtotal;
  const warnings = checkoutWarningMessages(session?.validationIssues);

  // The backend owns the shipping fee; the threshold only drives the progress copy.
  const isFreeShip = subtotal > 0 && (shippingFee === 0 || subtotal >= FREE_SHIPPING_THRESHOLD);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = isFreeShip
    ? 100
    : Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const selectedPayment = checkout.paymentMethods.find(
    (m) => m.zonePaymentMethodId === checkout.selectedPaymentId,
  );
  const submitting = checkout.status === "submitting";
  const canSubmit =
    checkout.status === "ready" &&
    Boolean(checkout.selectedDeliveryId && checkout.selectedPaymentId);
  const ctaLabel = submitting
    ? "Placing order…"
    : selectedPayment && (selectedPayment.requiresRedirect || isStripePaymentMethod(selectedPayment))
      ? "Continue to payment"
      : "Place order";

  // Once the order is placed the bag is consumed — keep the page on a
  // "taking you to payment" state instead of flashing the empty bag.
  const redirecting = submitting && orderableLines.length === 0;
  const isEmpty = hydrated && visibleLines.length === 0 && !submitting;
  const nothingOrderable = hydrated && visibleLines.length > 0 && orderableLines.length === 0;
  const showLayout = hydrated && orderableLines.length > 0;

  const bindShipping = (field: keyof AddressFields) => ({
    value: shipping[field] ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setShipping((prev) => ({ ...prev, [field]: e.target.value })),
  });
  const bindBilling = (field: keyof AddressFields) => ({
    value: billing[field] ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setBilling((prev) => ({ ...prev, [field]: e.target.value })),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The form is `noValidate` for styling; still surface native field errors.
    if (!event.currentTarget.reportValidity()) return;
    void checkout.submitCheckout({
      email,
      shipping,
      billingSameAsShipping: billingSame,
      // Billing has no phone field of its own — reuse the delivery contact.
      billing: billingSame ? undefined : { ...billing, phone: shipping.phone },
    });
  }

  function addFromCheckout(product: CatalogProduct) {
    if (!canAddToOrder(product)) return;
    // Instant in the summary; the checkout session rebuilds itself once the
    // bag changes and the background sync lands.
    addItemOptimistic({
      sku: product.sku,
      variantId: product.variantId,
      quantity: 1,
      line: {
        slug: product.slug,
        title: product.title,
        imageUrl: product.imageUrl ?? undefined,
        unitPrice: product.price ?? 0,
        currency: product.currency,
      },
    });
  }

  return (
    <div className="landing">
      <section className="collection-head checkout-head-section" aria-labelledby="checkout-heading">
        <div className="container container--full">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol className="crumbs__list" role="list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/cart">Bag</Link>
              </li>
              <li aria-current="page">Checkout</li>
            </ol>
          </nav>

          <header className="checkout-head">
            <h1 className="collection-head__title" id="checkout-heading">
              Checkout
            </h1>
            <ol className="checkout-steps">
              <li>
                <Link href="/cart">Bag</Link>
              </li>
              <li aria-hidden="true">·</li>
              <li className="is-current">Details &amp; payment</li>
            </ol>
          </header>

          {showLayout ? (
            <div className="checkout-layout">
              <button
                type="button"
                className="checkout-summary-toggle"
                aria-expanded={summaryOpen}
                aria-controls="checkout-summary"
                onClick={() => setSummaryOpen((v) => !v)}
              >
                <span>Order summary</span>
                <span className="checkout-summary-toggle__total" dir="ltr">
                  {formatMoney(total, currency)}
                  <i className="checkout-summary-toggle__chev" aria-hidden="true" />
                </span>
              </button>

              <form className="checkout-form" noValidate onSubmit={handleSubmit}>
                {missThis.length ? (
                  <MissThisSwiper
                    products={missThis}
                    addingSlug={null}
                    onAdd={(p) => void addFromCheckout(p)}
                    canAdd={canAddToOrder}
                  />
                ) : null}

                <section className="cbox">
                  <header className="cbox__head">
                    <h2>Delivery</h2>
                  </header>
                  <div className="cbox__grid">
                    <label className="fld fld--full">
                      <span>Email</span>
                      <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <label className="fld fld--full">
                      <span>Full name</span>
                      <input
                        type="text"
                        name="delName"
                        required
                        autoComplete="name"
                        placeholder="First and last name"
                        {...bindShipping("fullName")}
                      />
                    </label>
                    <label className="fld fld--full">
                      <span>Phone</span>
                      <input
                        type="tel"
                        name="delPhone"
                        required
                        minLength={7}
                        autoComplete="tel"
                        placeholder="+971 50 000 0000"
                        {...bindShipping("phone")}
                      />
                    </label>
                    <label className="fld fld--full">
                      <span>Address line 1</span>
                      <input
                        type="text"
                        name="delAddr1"
                        required
                        minLength={3}
                        autoComplete="address-line1"
                        placeholder="Street and building"
                        {...bindShipping("address1")}
                      />
                    </label>
                    <label className="fld fld--full">
                      <span>
                        Address line 2 <span className="fld__hint">(optional)</span>
                      </span>
                      <input
                        type="text"
                        name="delAddr2"
                        autoComplete="address-line2"
                        placeholder="Apartment, suite, floor"
                        {...bindShipping("address2")}
                      />
                    </label>
                    <label className="fld">
                      <span>City</span>
                      <input
                        type="text"
                        name="delCity"
                        required
                        autoComplete="address-level2"
                        {...bindShipping("city")}
                      />
                    </label>
                    <label className="fld">
                      <span>Emirate</span>
                      <div className="fld__select">
                        <select name="delEmirate" required autoComplete="address-level1" {...bindShipping("emirate")}>
                          <option value="">Select emirate</option>
                          {EMIRATES.map((e) => (
                            <option key={e}>{e}</option>
                          ))}
                        </select>
                        <b aria-hidden="true">▾</b>
                      </div>
                    </label>
                    <label className="fld fld--full">
                      <span>
                        Postal code <span className="fld__hint">(optional)</span>
                      </span>
                      <input
                        type="text"
                        name="delPostal"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        {...bindShipping("postalCode")}
                      />
                    </label>
                  </div>
                </section>

                <section className="cbox">
                  <header className="cbox__head">
                    <h2>Shipping method</h2>
                  </header>
                  {checkout.deliveryMethods.length ? (
                    <div className="pay-options" role="radiogroup" aria-label="Shipping methods">
                      {checkout.deliveryMethods.map((method) => {
                        const active = method.zoneDeliveryMethodId === checkout.selectedDeliveryId;
                        const eta = deliveryEta(method);
                        return (
                          <label
                            key={method.zoneDeliveryMethodId}
                            className={`pay-opt ${active ? "is-active" : ""}`}
                          >
                            <input
                              type="radio"
                              name="deliveryMethod"
                              value={method.zoneDeliveryMethodId}
                              checked={active}
                              disabled={submitting}
                              onChange={() => void checkout.chooseDelivery(method.zoneDeliveryMethodId)}
                            />
                            <span>
                              <span className="pay-opt__title">{method.displayName}</span>
                              <span className="pay-opt__note">
                                {[eta, deliveryFeeLabel(method, currency)].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pay-mock-note">
                      {checkout.status === "loading"
                        ? "Loading shipping options…"
                        : "No shipping options are available right now."}
                    </p>
                  )}
                </section>

                <section className="cbox">
                  <header className="cbox__head">
                    <h2>Billing information</h2>
                  </header>
                  <div className="cbox__body">
                    <label className="fld fld--check fld--full">
                      <input
                        type="checkbox"
                        id="billing-same"
                        name="billingSame"
                        checked={billingSame}
                        onChange={(e) => setBillingSame(e.target.checked)}
                      />
                      <span>Same as delivery address</span>
                    </label>
                    {!billingSame ? (
                      <div className="cbox__grid" id="billing-fields">
                        <label className="fld fld--full">
                          <span>Billing name</span>
                          <input type="text" name="billName" required autoComplete="billing name" {...bindBilling("fullName")} />
                        </label>
                        <label className="fld fld--full">
                          <span>Billing address line 1</span>
                          <input
                            type="text"
                            name="billAddr1"
                            required
                            minLength={3}
                            autoComplete="billing address-line1"
                            {...bindBilling("address1")}
                          />
                        </label>
                        <label className="fld fld--full">
                          <span>
                            Billing address line 2 <span className="fld__hint">(optional)</span>
                          </span>
                          <input type="text" name="billAddr2" autoComplete="billing address-line2" {...bindBilling("address2")} />
                        </label>
                        <label className="fld">
                          <span>City</span>
                          <input type="text" name="billCity" required autoComplete="billing address-level2" {...bindBilling("city")} />
                        </label>
                        <label className="fld">
                          <span>Emirate</span>
                          <div className="fld__select">
                            <select name="billEmirate" required autoComplete="billing address-level1" {...bindBilling("emirate")}>
                              <option value="">Select emirate</option>
                              {EMIRATES.map((e) => (
                                <option key={e}>{e}</option>
                              ))}
                            </select>
                            <b aria-hidden="true">▾</b>
                          </div>
                        </label>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="cbox">
                  <header className="cbox__head">
                    <h2>Payment method</h2>
                  </header>
                  <div className="pay-options" role="radiogroup" aria-label="Payment methods">
                    {checkout.paymentMethods.map((method) => {
                      const active = method.zonePaymentMethodId === checkout.selectedPaymentId;
                      const note = paymentMethodNote(method);
                      return (
                        <label
                          key={method.zonePaymentMethodId}
                          className={`pay-opt ${active ? "is-active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            value={method.zonePaymentMethodId}
                            checked={active}
                            disabled={submitting}
                            onChange={() => void checkout.choosePayment(method.zonePaymentMethodId)}
                          />
                          <span>
                            <span className="pay-opt__title">{method.displayName}</span>
                            {note ? <span className="pay-opt__note">{note}</span> : null}
                          </span>
                        </label>
                      );
                    })}
                    <label className="pay-opt pay-opt--disabled">
                      <input type="radio" name="payMethod" value="tabby" disabled />
                      <span>
                        <span className="pay-opt__title">Tabby</span>
                        <span className="pay-opt__note">Pay in 4 · interest-free</span>
                      </span>
                      <span className="pay-opt__badge">Coming soon</span>
                    </label>
                    <label className="pay-opt pay-opt--disabled">
                      <input type="radio" name="payMethod" value="tamara" disabled />
                      <span>
                        <span className="pay-opt__title">Tamara</span>
                        <span className="pay-opt__note">Split payments</span>
                      </span>
                      <span className="pay-opt__badge">Coming soon</span>
                    </label>
                  </div>
                  {!checkout.paymentMethods.length ? (
                    <p className="pay-mock-note">
                      {checkout.status === "loading"
                        ? "Loading payment options…"
                        : "No payment options are available right now."}
                    </p>
                  ) : (
                    <p className="pay-mock-note">
                      Card details are never entered on this page — they go straight to our payment partner.
                    </p>
                  )}
                </section>

                {checkout.errorMsg ? (
                  <p className="checkout-error" role="alert">
                    {checkout.errorMsg}
                    {checkout.status === "error" ? (
                      <>
                        {" "}
                        <button type="button" className="checkout-link" onClick={checkout.retry}>
                          Try again
                        </button>
                      </>
                    ) : null}
                  </p>
                ) : null}

                <button type="submit" className="checkout-cta" id="place-order" disabled={!canSubmit}>
                  <span>{ctaLabel}</span>
                  <b className="arrow" aria-hidden="true">↗</b>
                </button>
                <p className="checkout-legal">
                  By placing this order you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>. Payment
                  is encrypted.
                </p>
              </form>

              <aside
                className={`checkout-summary ${summaryOpen ? "is-open" : ""}`}
                id="checkout-summary"
                aria-label="Order summary"
              >
                <h2>Your order</h2>
                {subtotal > 0 ? (
                  <div className={`checkout-ship ${isFreeShip ? "is-free" : ""}`} aria-live="polite">
                    <p>
                      {isFreeShip
                        ? "You qualify for free shipping!"
                        : `Spend ${formatMoney(remaining, currency)} more for free shipping.`}
                    </p>
                    <div className="cart-ship-track">
                      <div className="cart-ship-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                ) : null}
                <div className="checkout-lines" id="checkout-lines">
                  {orderableLines.map((line) => {
                    const thumb = lineImageUrl(line.slug, line.imageUrl);
                    return (
                      <article className="coline" key={line.cartItemId ?? line.variantId}>
                        <div className="coline__media">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={line.title}
                              onError={(e) => {
                                e.currentTarget.style.visibility = "hidden";
                              }}
                            />
                          ) : null}
                          <b>{line.quantity}</b>
                        </div>
                        <div className="coline__body">
                          <h3>{line.title}</h3>
                          {line.sizeLabel ? <p>{line.sizeLabel}</p> : null}
                        </div>
                        <span className="coline__price" dir="ltr">
                          {formatMoney(line.unitPrice * line.quantity, line.currency)}
                        </span>
                      </article>
                    );
                  })}
                  {COMPLIMENTARY_SAMPLES.map((sample) => {
                    const thumb = lineImageUrl(sample.slug);
                    return (
                      <article className="coline coline--gift" key={`gift-${sample.slug}`}>
                        <div className="coline__media">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={sample.title} />
                          ) : null}
                          <b>1</b>
                        </div>
                        <div className="coline__body">
                          <h3>{sample.title}</h3>
                          <p>{sample.sizeLabel}</p>
                          <p className="coline__gift-tag">Selected free sample (−{formatMoney(sample.value, currency)})</p>
                        </div>
                        <span className="coline__price coline__price--gift" dir="ltr">
                          <s>{formatMoney(sample.value, currency)}</s>
                          <strong>Free</strong>
                        </span>
                      </article>
                    );
                  })}
                </div>
                {leftOutCount > 0 ? (
                  <p className="checkout-note">
                    {leftOutCount === 1 ? "1 item" : `${leftOutCount} items`} in your bag can’t be ordered online and
                    won’t be included.
                  </p>
                ) : null}
                {addOns.length ? (
                  <div className="checkout-addons">
                    <h3 className="checkout-addons__title">Add-ons</h3>
                    {addOns.map((product) => (
                      <CheckoutAddonRow
                        key={product.id}
                        product={product}
                        adding={false}
                        onAdd={(p) => void addFromCheckout(p)}
                        disabled={!canAddToOrder(product)}
                      />
                    ))}
                  </div>
                ) : null}
                <dl className="checkout-totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd dir="ltr">{formatMoney(subtotal, currency)}</dd>
                  </div>
                  {discount > 0 ? (
                    <div>
                      <dt>Discount</dt>
                      <dd dir="ltr">−{formatMoney(discount, currency)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Shipping</dt>
                    <dd dir="ltr">{shippingFee === 0 ? "Free" : formatMoney(shippingFee, currency)}</dd>
                  </div>
                  {tax > 0 ? (
                    <div>
                      <dt>Tax</dt>
                      <dd dir="ltr">{formatMoney(tax, currency)}</dd>
                    </div>
                  ) : null}
                  <div className="checkout-totals-line">
                    <dt>Total</dt>
                    <dd dir="ltr">{formatMoney(total, currency)}</dd>
                  </div>
                </dl>
                {warnings.map((warning) => (
                  <p className="checkout-note" key={warning} role="status">
                    {warning}
                  </p>
                ))}
                <p className="checkout-badges">SSL Encrypted · 30-day guarantee · Ships from Sharjah</p>
              </aside>
            </div>
          ) : null}

          {redirecting ? (
            <section className="checkout-done" aria-live="polite">
              <span className="checkout-spinner" aria-hidden="true" />
              <p className="collection-head__eyebrow">Order placed</p>
              <h2 className="collection-head__title">Taking you to payment…</h2>
              <p className="collection-head__intro">Please don’t close or refresh this page.</p>
            </section>
          ) : null}

          {nothingOrderable ? (
            <section className="checkout-empty">
              <p className="collection-head__eyebrow">Can’t check out yet</p>
              <h2 className="collection-head__title">These items can’t be ordered online.</h2>
              <p>Please return to your bag and add them again from the collection.</p>
              <Link className="checkout-cta checkout-cta--inline" href="/cart">
                <span>Back to bag</span>
                <b className="arrow" aria-hidden="true">↗</b>
              </Link>
            </section>
          ) : null}

          {isEmpty ? (
            <section className="checkout-empty" id="checkout-empty">
              <p className="collection-head__eyebrow">Empty bag</p>
              <h2 className="collection-head__title">Nothing to check out yet.</h2>
              <Link className="checkout-cta checkout-cta--inline" href="/products">
                <span>Explore the collection</span>
                <b className="arrow" aria-hidden="true">↗</b>
              </Link>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
