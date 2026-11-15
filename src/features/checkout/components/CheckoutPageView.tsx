"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { MissThisSwiper } from "@/features/cart/components/MissThisSwiper";
import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  checkoutCrumbsList,
  collectionHeadFlush,
  crumbs,
  doneTitle,
  pageTitle,
  stateEyebrow,
} from "@/styles/shopChrome";
import { pageContainer } from "@/styles/siteChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutEmpty,
  checkoutForm,
  checkoutHead,
  checkoutLayout,
  checkoutStepCurrent,
  checkoutSteps,
  checkoutSummaryChevron,
  checkoutSummaryToggle,
  checkoutSummaryToggleTotal,
} from "@/styles/checkoutChrome";
import { GooglePlacesProvider } from "@/lib/google/GooglePlacesProvider";
import { CheckoutBilling } from "./checkout/CheckoutBilling";
import { CheckoutDelivery } from "./checkout/CheckoutDelivery";
import { CheckoutPayment } from "./checkout/CheckoutPayment";
import { CheckoutShippingMethod } from "./checkout/CheckoutShippingMethod";
import { CheckoutSummary } from "./checkout/CheckoutSummary";
import { useCheckoutForm } from "../hooks/useCheckoutForm";

export function CheckoutPageView() {
  const {
    checkout,
    session,
    countryCode,
    regionSet,
    testData,
    fillTestData,
    email,
    setEmail,
    shipping,
    setShipping,
    billing,
    setBilling,
    billingSame,
    setBillingSame,
    summaryOpen,
    setSummaryOpen,
    summaryLines,
    leftOutCount,
    missThis,
    canAddToOrder,
    addFromCheckout,
    currency,
    subtotal,
    shippingFee,
    discount,
    tax,
    total,
    promoSnapshot,
    shipDiscount,
    giftCards,
    amountPayable,
    warnings,
    earnPreview,
    submitting,
    payLang,
    tabbyPrescore,
    canSubmit,
    ctaKind,
    isEmpty,
    nothingOrderable,
    hasUnavailable,
    showLayout,
    bindShipping,
    bindBilling,
    applyPlaceToShipping,
    applyPlaceToBilling,
    handleSubmit,
  } = useCheckoutForm();
  const ctaLabel =
    ctaKind === "submitting"
      ? "Placing order…"
      : ctaKind === "continue"
        ? "Continue to payment"
        : "Place order";

  return (
    <div>
      <section
        className={collectionHeadFlush}
        aria-labelledby="checkout-heading"
      >
        <div className={pageContainer}>
          <nav className={crumbs} aria-label="Breadcrumb">
            <ol className={checkoutCrumbsList} role="list">
              <li>
                <LocaleLink href="/">Home</LocaleLink>
              </li>
              <li>
                <LocaleLink href="/cart">Bag</LocaleLink>
              </li>
              <li aria-current="page">Checkout</li>
            </ol>
          </nav>

          <header className={checkoutHead}>
            <h1 className={pageTitle} id="checkout-heading">
              Checkout
            </h1>
            <ol className={checkoutSteps}>
              <li>
                <LocaleLink href="/cart">Bag</LocaleLink>
              </li>
              <li aria-hidden="true">·</li>
              <li className={checkoutStepCurrent}>Details &amp; payment</li>
            </ol>
          </header>

          {showLayout ? (
            <div className={checkoutLayout}>
              <button
                type="button"
                className={checkoutSummaryToggle}
                aria-expanded={summaryOpen}
                aria-controls="checkout-summary"
                onClick={() => setSummaryOpen((v) => !v)}
              >
                <span>Order summary</span>
                <span className={checkoutSummaryToggleTotal} dir="ltr">
                  {formatMoney(amountPayable ?? total, currency)}
                  <i className={checkoutSummaryChevron} aria-hidden="true" />
                </span>
              </button>

              <GooglePlacesProvider>
                <form
                  id="checkout-form"
                  className={checkoutForm}
                  noValidate
                  onSubmit={handleSubmit}
                >
                  {missThis.length ? (
                    <MissThisSwiper
                      products={missThis}
                      addingSlug={null}
                      onAdd={(p) => void addFromCheckout(p)}
                      canAdd={canAddToOrder}
                    />
                  ) : null}

                  <CheckoutDelivery
                    email={email}
                    onEmail={setEmail}
                    shipping={shipping}
                    bind={bindShipping}
                    onPhone={(phone) =>
                      setShipping((prev) => ({ ...prev, phone }))
                    }
                    onAddress1={(value) =>
                      setShipping((prev) => ({ ...prev, address1: value }))
                    }
                    onPlace={applyPlaceToShipping}
                    countryCode={countryCode}
                    regionSet={regionSet}
                    beforeFields={
                      testData ? (
                        <div className="col-span-full flex items-center justify-between gap-3 rounded-md border border-dashed border-[var(--line,#d9ccb4)] px-3 py-2 text-[0.8rem] text-[var(--ink-2,#5b5148)]">
                          <span>Test site: fill this form with test details.</span>
                          <button
                            type="button"
                            className="shrink-0 rounded-full border border-copper px-3 py-1 font-medium text-copper hover:bg-[rgba(140,68,53,0.06)]"
                            onClick={fillTestData}
                          >
                            Fill test data
                          </button>
                        </div>
                      ) : null
                    }
                  />
                  <CheckoutShippingMethod
                    methods={checkout.deliveryMethods}
                    selectedId={checkout.selectedDeliveryId}
                    status={checkout.status}
                    submitting={submitting}
                    currency={currency}
                    onSelect={(id) => void checkout.chooseDelivery(id)}
                  />
                  <CheckoutBilling
                    billingSame={billingSame}
                    onBillingSame={setBillingSame}
                    billing={billing}
                    bind={bindBilling}
                    onAddress1={(value) =>
                      setBilling((prev) => ({ ...prev, address1: value }))
                    }
                    onPlace={applyPlaceToBilling}
                    countryCode={countryCode}
                    regionSet={regionSet}
                  />
                  <CheckoutPayment
                    methods={checkout.paymentMethods}
                    countryCode={countryCode}
                    selectedId={checkout.selectedPaymentId}
                    status={checkout.status}
                    submitting={submitting}
                    errorMsg={checkout.errorMsg}
                    onRetry={checkout.retry}
                    onSelect={(id) => checkout.choosePayment(id)}
                    canSubmit={canSubmit}
                    ctaLabel={ctaLabel}
                    amountPayable={amountPayable}
                    currency={currency}
                    inlinePayment={checkout.inlinePayment}
                    shopperEmail={email}
                    shopperName={shipping.fullName}
                    shopperPhone={shipping.phone}
                    tabbyPrescore={tabbyPrescore}
                    tabbyLang={payLang}
                    onPayNow={() => {
                      const form = document.getElementById("checkout-form");
                      if (form instanceof HTMLFormElement) form.requestSubmit();
                    }}
                  />
                </form>
              </GooglePlacesProvider>

              <CheckoutSummary
                open={summaryOpen}
                orderableLines={summaryLines}
                leftOutCount={leftOutCount}
                subtotal={subtotal}
                promoSnapshot={promoSnapshot}
                currency={currency}
                session={session}
                onCheckoutSession={checkout.adoptSession}
                discount={discount}
                shippingFee={shippingFee}
                shipDiscount={shipDiscount}
                tax={tax}
                total={total}
                amountPayable={amountPayable}
                giftCards={giftCards}
                warnings={warnings}
                earnPreview={earnPreview.preview}
              />
            </div>
          ) : null}

          {hasUnavailable ? (
            <section className={checkoutEmpty}>
              <p className={stateEyebrow}>Can’t check out yet</p>
              <h2 className={doneTitle}>An item in your bag is unavailable.</h2>
              <p>Remove it from your bag, then continue.</p>
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href="/cart"
              >
                <span>Back to bag</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}

          {nothingOrderable ? (
            <section className={checkoutEmpty}>
              <p className={stateEyebrow}>Can’t check out yet</p>
              <h2 className={doneTitle}>
                These items can’t be ordered online.
              </h2>
              <p>
                Please return to your bag and add them again from the
                collection.
              </p>
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href="/cart"
              >
                <span>Back to bag</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}

          {isEmpty ? (
            <section className={checkoutEmpty} id="checkout-empty">
              <p className={stateEyebrow}>Empty bag</p>
              <h2 className={doneTitle}>Nothing to check out yet.</h2>
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href="/products"
              >
                <span>Explore the collection</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
