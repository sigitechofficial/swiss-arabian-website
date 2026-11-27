"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { MissThisSwiper } from "@/features/cart/components/MissThisSwiper";
import { formatMoney } from "@/lib/format/money";
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
import { CheckoutQuestions } from "./checkout/CheckoutQuestions";
import { OrderChangedModal } from "./OrderChangedModal";
import { CheckoutShippingMethod } from "./checkout/CheckoutShippingMethod";
import { CheckoutSummary } from "./checkout/CheckoutSummary";
import { useCheckoutForm } from "../hooks/useCheckoutForm";

export function CheckoutPageView() {
  const t = useShopCopy();
  const router = useLocaleRouter();
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
    questions,
    answers,
    setAnswer,
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
    payableRounding,
    warnings,
    earnPreview,
    submitting,
    payLang,
    tabbyPrescore,
    tamaraPrecheck,
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
      ? t("checkout.cta.placing")
      : ctaKind === "continue"
        ? t("checkout.cta.continue")
        : t("checkout.cta.place");

  return (
    <div>
      <section
        className={collectionHeadFlush}
        aria-labelledby="checkout-heading"
      >
        <div className={pageContainer}>
          <nav className={crumbs} aria-label={t("account.breadcrumbNav")}>
            <ol className={checkoutCrumbsList} role="list">
              <li>
                <LocaleLink href="/">{t("home")}</LocaleLink>
              </li>
              <li>
                <LocaleLink href="/cart">{t("nav.bag")}</LocaleLink>
              </li>
              <li aria-current="page">{t("pages.title.checkout")}</li>
            </ol>
          </nav>

          <header className={checkoutHead}>
            <h1 className={pageTitle} id="checkout-heading">
              {t("pages.title.checkout")}
            </h1>
            <ol className={checkoutSteps}>
              <li>
                <LocaleLink href="/cart">{t("nav.bag")}</LocaleLink>
              </li>
              <li aria-hidden="true">·</li>
              <li className={checkoutStepCurrent}>{t("subs.checkout.detailsStep")}</li>
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
                <span>{t("orders.summary")}</span>
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
                          <span>{t("checkout.testData.note")}</span>
                          <button
                            type="button"
                            className="shrink-0 rounded-full border border-copper px-3 py-1 font-medium text-copper hover:bg-[rgba(140,68,53,0.06)]"
                            onClick={fillTestData}
                          >
                            {t("checkout.testData.fill")}
                          </button>
                        </div>
                      ) : null
                    }
                  />
                  <CheckoutQuestions
                    questions={questions}
                    answers={answers}
                    onAnswer={setAnswer}
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
                    tamaraPrecheck={tamaraPrecheck}
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
                payableRounding={payableRounding}
                giftCards={giftCards}
                warnings={warnings}
                earnPreview={earnPreview.preview}
              />
            </div>
          ) : null}

          {hasUnavailable ? (
            <section className={checkoutEmpty}>
              <p className={stateEyebrow}>{t("checkout.blocked.eyebrow")}</p>
              <h2 className={doneTitle}>{t("checkout.blocked.unavailable")}</h2>
              <p>{t("checkout.blocked.unavailableBody")}</p>
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href="/cart"
              >
                <span>{t("checkout.orderChanged.backToBag")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}

          {nothingOrderable ? (
            <section className={checkoutEmpty}>
              <p className={stateEyebrow}>{t("checkout.blocked.eyebrow")}</p>
              <h2 className={doneTitle}>
                {t("checkout.blocked.notOnline")}
              </h2>
              <p>
                {t("checkout.blocked.notOnlineBody")}
              </p>
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href="/cart"
              >
                <span>{t("checkout.orderChanged.backToBag")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}

          {isEmpty ? (
            <section className={checkoutEmpty} id="checkout-empty">
              <p className={stateEyebrow}>{t("checkout.empty.eyebrow")}</p>
              <h2 className={doneTitle}>{t("checkout.empty.title")}</h2>
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href="/products"
              >
                <span>{t("checkout.empty.explore")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}
        </div>
      </section>
      {checkout.orderChanges ? (
        <OrderChangedModal
          changes={checkout.orderChanges}
          onConfirm={checkout.confirmOrderChanges}
          onReview={checkout.dismissOrderChanges}
          onBackToBag={() => {
            checkout.dismissOrderChanges();
            router.push("/cart");
          }}
        />
      ) : null}
    </div>
  );
}
