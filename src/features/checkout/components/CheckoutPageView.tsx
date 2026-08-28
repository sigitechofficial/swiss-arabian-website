"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { CATALOG_PRODUCTS } from "@/features/catalog/constants/catalogProducts";
import { useCartStore } from "@/stores/useCartStore";

/** Matches the `v5/checkout.html` prototype's cart constants. */
const FREE_SHIPPING_THRESHOLD = 250;
const SHIP_FLAT = 25;

/** Prefer the static catalog image for known slugs so a stale/wrong
 *  `imageUrl` persisted in localStorage (older asset paths) doesn't show
 *  a broken thumb in the order summary. */
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

type PayMethod = "card" | "tabby" | "tamara";

export function CheckoutPageView() {
  const persistedLines = useCartStore((s) => s.lines);
  const persistedSubtotal = useCartStore((s) => s.subtotal());
  const totals = useCartStore((s) => s.totals);
  const clearCart = useCartStore((s) => s.clear);

  // The cart is persisted to localStorage, invisible to the server — so the
  // very first client render must still report an empty bag (matching SSR)
  // and only pick up the real, rehydrated cart once mounted. See the same
  // guard in `SiteHeader`'s bag-count badge / `CartPageView`.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const lines = mounted ? persistedLines : [];
  const subtotal = mounted ? persistedSubtotal : 0;

  const formRef = useRef<HTMLFormElement>(null);
  const [billingSame, setBillingSame] = useState(true);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [payMockNoteVisible, setPayMockNoteVisible] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [order, setOrder] = useState<{ firstName: string; orderNo: string } | null>(null);

  const currency = totals?.currency ?? "AED";
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIP_FLAT;
  const total = subtotal + shipping;

  const isEmpty = lines.length === 0 && !order;
  const isDone = Boolean(order);
  const showLayout = !isEmpty && !isDone;

  const summaryTotalLabel = useMemo(() => formatMoney(total, currency), [total, currency]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (payMethod !== "card") {
      setPayMockNoteVisible(true);
      return;
    }

    const form = event.currentTarget;
    const fullName = (form.elements.namedItem("delName") as HTMLInputElement | null)?.value.trim() ?? "";
    const firstName = fullName.split(" ")[0] || "friend";
    const orderNo = "SA-" + Math.floor(100000 + Math.random() * 900000);

    clearCart();
    setOrder({ firstName, orderNo });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                  {summaryTotalLabel}
                  <i className="checkout-summary-toggle__chev" aria-hidden="true" />
                </span>
              </button>

              <form className="checkout-form" ref={formRef} noValidate onSubmit={handleSubmit}>
                <section className="cbox">
                  <header className="cbox__head">
                    <span className="cbox__num">01</span>
                    <h2>Delivery</h2>
                  </header>
                  <div className="cbox__grid">
                    <label className="fld fld--full">
                      <span>Full name</span>
                      <input type="text" name="delName" required autoComplete="name" placeholder="First and last name" />
                    </label>
                    <label className="fld fld--full">
                      <span>Phone</span>
                      <input type="tel" name="delPhone" required autoComplete="tel" placeholder="+971 50 000 0000" />
                    </label>
                    <label className="fld fld--full">
                      <span>Address line 1</span>
                      <input type="text" name="delAddr1" required autoComplete="address-line1" placeholder="Street and building" />
                    </label>
                    <label className="fld fld--full">
                      <span>
                        Address line 2 <span className="fld__hint">(optional)</span>
                      </span>
                      <input type="text" name="delAddr2" autoComplete="address-line2" placeholder="Apartment, suite, floor" />
                    </label>
                    <label className="fld">
                      <span>City</span>
                      <input type="text" name="delCity" required autoComplete="address-level2" />
                    </label>
                    <label className="fld">
                      <span>Emirate</span>
                      <div className="fld__select">
                        <select name="delEmirate" required autoComplete="address-level1" defaultValue="">
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
                      <input type="text" name="delPostal" autoComplete="postal-code" inputMode="numeric" />
                    </label>
                  </div>
                </section>

                <section className="cbox">
                  <header className="cbox__head">
                    <span className="cbox__num">02</span>
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
                          <input type="text" name="billName" required autoComplete="billing name" />
                        </label>
                        <label className="fld fld--full">
                          <span>Billing address line 1</span>
                          <input type="text" name="billAddr1" required autoComplete="billing address-line1" />
                        </label>
                        <label className="fld fld--full">
                          <span>
                            Billing address line 2 <span className="fld__hint">(optional)</span>
                          </span>
                          <input type="text" name="billAddr2" autoComplete="billing address-line2" />
                        </label>
                        <label className="fld">
                          <span>City</span>
                          <input type="text" name="billCity" required autoComplete="billing address-level2" />
                        </label>
                        <label className="fld">
                          <span>Emirate</span>
                          <div className="fld__select">
                            <select name="billEmirate" required autoComplete="billing address-level1" defaultValue="">
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
                    <span className="cbox__num">03</span>
                    <h2>Payment method</h2>
                  </header>
                  <div className="pay-options" role="radiogroup" aria-label="Payment methods">
                    <label className={`pay-opt ${payMethod === "card" ? "is-active" : ""}`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="card"
                        checked={payMethod === "card"}
                        onChange={() => {
                          setPayMethod("card");
                          setPayMockNoteVisible(false);
                        }}
                      />
                      <span>
                        <span className="pay-opt__title">Credit / debit card</span>
                        <span className="pay-opt__note">Visa, Mastercard, Amex</span>
                      </span>
                    </label>
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

                  {payMethod === "card" ? (
                    <div className="cbox__grid card-fields" id="card-fields">
                      <label className="fld fld--full">
                        <span>Card number</span>
                        <input
                          type="text"
                          name="card"
                          required
                          inputMode="numeric"
                          placeholder="1234  5678  9012  3456"
                          autoComplete="cc-number"
                        />
                      </label>
                      <label className="fld">
                        <span>Expiry</span>
                        <input type="text" name="exp" required placeholder="MM / YY" autoComplete="cc-exp" />
                      </label>
                      <label className="fld">
                        <span>CVC</span>
                        <input type="text" name="cvc" required inputMode="numeric" placeholder="•••" autoComplete="cc-csc" />
                      </label>
                      <label className="fld fld--full">
                        <span>Name on card</span>
                        <input type="text" name="cardName" required autoComplete="cc-name" />
                      </label>
                    </div>
                  ) : null}

                  {payMockNoteVisible ? (
                    <p className="pay-mock-note">This payment method isn’t connected in this preview yet.</p>
                  ) : null}
                </section>

                <button type="submit" className="checkout-cta" id="place-order">
                  <span>Place order</span>
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
                <div className="checkout-lines" id="checkout-lines">
                  {lines.map((line) => {
                    const thumb = lineImageUrl(line.slug, line.imageUrl);
                    return (
                    <article className="coline" key={line.cartItemId ?? line.variantId}>
                      <div className="coline__media">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt={line.title} />
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
                </div>
                <dl className="checkout-totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd dir="ltr">{formatMoney(subtotal, currency)}</dd>
                  </div>
                  <div>
                    <dt>Shipping</dt>
                    <dd dir="ltr">{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd>
                  </div>
                  <div className="checkout-totals-line">
                    <dt>Total</dt>
                    <dd dir="ltr">{formatMoney(total, currency)}</dd>
                  </div>
                </dl>
                <p className="checkout-badges">SSL Encrypted · 30-day guarantee · Ships from Sharjah</p>
              </aside>
            </div>
          ) : null}

          {isDone && order ? (
            <section className="checkout-done" id="checkout-done">
              <p className="collection-head__eyebrow">Order confirmed</p>
              <h1 className="collection-head__title">
                Thank you, <em className="collection-head__em">{order.firstName}</em>.
              </h1>
              <p className="collection-head__intro">
                Your order <strong>#{order.orderNo}</strong> is being prepared in Sharjah. A confirmation will land in
                your inbox within minutes.
              </p>
              <Link className="checkout-cta checkout-cta--inline" href="/">
                <span>Return home</span>
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
