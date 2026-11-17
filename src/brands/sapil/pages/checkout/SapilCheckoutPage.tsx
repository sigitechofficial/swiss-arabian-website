"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { useBag } from "@/features/cart/hooks/useBag";
import { useMarketDelivery } from "@/features/markets/hooks/useMarketDelivery";
import { SapilInlinePayment, SapilTabbyCard } from "../../components/checkout/SapilInlinePayment";
import { SapilPointsBox } from "../../components/checkout/SapilPointsBox";
import { applyGooglePlace, useCheckoutForm } from "@/features/checkout/hooks/useCheckoutForm";
import { usePaymentOptions } from "@/features/checkout/hooks/usePaymentOptions";
import { deliveryOptionTitles, paymentStepKinds } from "@/features/checkout/utils/methodLabels";
import type { PayRow } from "@/features/checkout/utils/paymentOptions";
import { appliedCoupon, useFreeShippingBar } from "@/features/promotions";
import { useCouponForm } from "@/features/promotions/hooks/useCouponForm";
import { useGiftAwards } from "@/features/promotions/hooks/useGiftAwards";
import { getBrand } from "@/lib/brand";
import { GooglePlacesProvider } from "@/lib/google/GooglePlacesProvider";
import { loyaltyLineFromQuote } from "@/features/loyalty/hooks/useLoyaltyRedemption";
import { readLoyaltyRedemption } from "@/features/loyalty/types/loyalty";
import { useCartStore } from "@/stores/useCartStore";
import { Button, Wrap, type RadioCardOption } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { linePriceParts, lineHref } from "../../components/bag/bagData";
import {
  CheckoutEmptyCard,
  OrderSummary,
  SummaryToggle,
  type AddressErrors,
  type SummaryLine,
  type SummaryTotalRow,
} from "../../components/checkout/CheckoutParts";
import {
  BillingSection,
  CheckoutCta,
  CheckoutTop,
  DeliverySection,
  PaymentSection,
  ShippingMethodSection,
  etaText,
  feeText,
  isCashMethod,
  paymentKindsText,
  type CheckoutAddress,
} from "../../components/checkout/CheckoutSections";
import { EarnNote, GiftCardBox, MissThisRow } from "../../components/checkout/CheckoutExtras";
import { isValidMobile } from "../../components/commerce/SapilPhoneField";
import {
  DEFAULT_TILE,
  SapilLink,
  SapilSkeleton,
  richText,
  useSapilMoney,
  useSapilMoneyParts,
} from "../../components/commerce/shared";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function dialCodeFor(country: string): string {
  try {
    return getCountryCallingCode(country.toUpperCase() as CountryCode);
  } catch {
    return "971";
  }
}

/** Client checks before the API sees the address (inline message under each field). */
function validateAddress(
  email: string,
  address: CheckoutAddress,
  t: SapilTranslator,
  regionKey: "emirate" | "region",
  withContact = true,
): AddressErrors {
  const errors: AddressErrors = {};
  if (withContact && !EMAIL.test(email.trim())) errors.email = t("checkout.emailError");
  if (!address.fullName.trim()) errors.fullName = t("checkout.fullNameError");
  if (withContact && !isValidMobile(address.phone)) errors.phone = t("checkout.phoneError");
  if (address.address1.trim().length < 3) errors.address1 = t("checkout.streetError");
  if (!address.city.trim()) errors.city = t("checkout.cityError");
  if (!address.emirate) errors.emirate = regionKey === "emirate" ? t("checkout.emirateError") : t("checkout.regionError");
  return errors;
}

/** Form order: the first field with an error gets focus. */
const SHIP_FIELDS: Array<[keyof AddressErrors, string]> = [
  ["email", "co-email"],
  ["fullName", "ship-name"],
  ["phone", "co-phone"],
  ["address1", "ship-street"],
  ["city", "ship-area"],
  ["emirate", "ship-region"],
];
const BILL_FIELDS: Array<[keyof AddressErrors, string]> = [
  ["fullName", "bill-name"],
  ["address1", "bill-street"],
  ["city", "bill-area"],
  ["emirate", "bill-region"],
];

function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/**
 * Sapil checkout in Swiss Arabian's layout (`CheckoutPageView`): one page with
 * Delivery, Shipping method, Billing information and Payment, then Place
 * order; the order summary beside it (a toggle above the form on phones).
 * Sapil styling and copy; every rule lives in the shared checkout hooks.
 */
export function SapilCheckoutPage() {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const moneyParts = useSapilMoneyParts();
  const f = useCheckoutForm();
  const bag = useBag();
  const coupon = useCouponForm();
  const ship = useFreeShippingBar();
  const marketDelivery = useMarketDelivery();
  const cartLoyalty = useCartStore((s) => s.loyaltyRedemption);
  const { checkout, session, currency } = f;
  const gifts = useGiftAwards(f.promoSnapshot, currency);

  const [errors, setErrors] = useState<AddressErrors>({});
  const [billingErrors, setBillingErrors] = useState<AddressErrors>({});

  const regionKey = f.countryCode === "AE" ? "emirate" : "region";
  const region = {
    regionLabel: regionKey === "emirate" ? t("checkout.emirate") : t("checkout.region"),
    regionPlaceholder: regionKey === "emirate" ? t("checkout.emiratePlaceholder") : t("checkout.regionPlaceholder"),
    regions: f.regionSet?.regions ?? [],
    countryCode: f.countryCode,
  };
  const dialCode = dialCodeFor(f.countryCode);

  const payKinds = useMemo(() => paymentStepKinds(checkout.paymentMethods), [checkout.paymentMethods]);
  const payment = usePaymentOptions({
    methods: checkout.paymentMethods,
    countryCode: f.countryCode,
    selectedId: checkout.selectedPaymentId,
    submitting: f.submitting,
    amountPayable: f.amountPayable,
    inlinePayment: checkout.inlinePayment,
    onSelect: (id) => checkout.choosePayment(id),
    onPayNow: () => {
      const form = document.getElementById("checkout-form");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    },
    tabbyPrescore: f.tabbyPrescore,
    tabbyLang: f.payLang,
  });

  /** Delivery and (when separate) billing; focuses the first field to fix. */
  function checkFields(): boolean {
    const shipFound = validateAddress(f.email, f.shipping, t, regionKey);
    const billFound = f.billingSame
      ? {}
      : validateAddress(f.email, { ...f.billing, phone: f.shipping.phone }, t, regionKey, false);
    setErrors(shipFound);
    setBillingErrors(billFound);
    const first =
      SHIP_FIELDS.find(([key]) => shipFound[key])?.[1] ?? BILL_FIELDS.find(([key]) => billFound[key])?.[1];
    if (first) {
      window.requestAnimationFrame(() => focusField(first));
      return false;
    }
    return true;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!checkFields()) {
      event.preventDefault();
      return;
    }
    f.handleSubmit(event);
  }

  const setShippingField = (field: keyof CheckoutAddress, value: string) => {
    f.setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof AddressErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const setBillingField = (field: keyof CheckoutAddress, value: string) => {
    f.setBilling((prev) => ({ ...prev, [field]: value }));
    if (billingErrors[field as keyof AddressErrors]) setBillingErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ——— states before the form ——— */
  if (!f.hydrated) {
    return (
      <Wrap className="w-full pt-[40px] pb-[88px] min-h-[70vh]" aria-busy="true">
        <p className="sr-only" role="status">
          {t("checkout.loading")}
        </p>
        <SapilSkeleton className="h-[18px] w-[180px] mb-[18px]" />
        <SapilSkeleton className="h-[52px] w-[260px] mb-[28px]" />
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(280px,440px)] gap-[48px] max-900:grid-cols-[1fr]">
          <SapilSkeleton className="h-[480px] !rounded-[24px] max-900:h-[320px]" />
          <SapilSkeleton className="h-[420px] !rounded-[28px] max-900:hidden" />
        </div>
      </Wrap>
    );
  }

  if (f.isEmpty || f.hasUnavailable || f.nothingOrderable) {
    const [title, body, cta, href] = f.isEmpty
      ? [t("checkout.emptyTitle"), t("checkout.emptyBody"), t("checkout.emptyCta"), "/products"]
      : f.hasUnavailable
        ? [t("checkout.unavailableTitle"), t("checkout.unavailableBody"), t("checkout.backToBag"), "/cart"]
        : [t("checkout.notOrderableTitle"), t("checkout.notOrderableBody"), t("checkout.backToBag"), "/cart"];
    return (
      <>
        <CheckoutTop />
        <Wrap className="w-full pb-[88px] max-900:pb-[56px] min-h-[50vh]">
          <CheckoutEmptyCard title={title} body={body} actions={<Button href={href} LinkComponent={SapilLink}>{cta}</Button>} />
        </Wrap>
      </>
    );
  }

  if (!f.showLayout) return <></>;

  /* ——— summary data ——— */
  const applied = appliedCoupon(f.promoSnapshot);
  const summaryLines: SummaryLine[] = f.summaryLines.map((line) => {
    const prices = linePriceParts(line, f.promoSnapshot, bag.promotions);
    return {
      key: line.cartItemId ?? line.variantId,
      name: line.title,
      href: lineHref(line),
      imageSrc: line.imageUrl,
      tile: DEFAULT_TILE,
      quantity: line.quantity,
      max: line.maxQuantity,
      meta: line.sizeLabel && line.sizeLabel !== line.title ? line.sizeLabel : undefined,
      price: money(prices.sale ?? prices.list, line.currency),
      was: prices.sale != null ? money(prices.list, line.currency) : undefined,
    };
  });
  const giftLines: ReactNode[] = gifts.views.flatMap((view) =>
    view.kind === "awarded"
      ? view.gifts.map((gift) => (
          <div key={gift.key} className="flex items-center justify-between gap-[12px] py-[10px] border-b border-sapil-line text-[14px]">
            <span>
              <span className="me-[6px] py-[1px] px-[8px] rounded-full bg-sapil-ok-soft text-sapil-ok text-[12px] font-[600]">
                {t("checkout.freeGift")}
              </span>
              {gift.title} × {gift.line.quantity}
            </span>
            <span className="font-[600]">{t("bag.giftFree")}</span>
          </div>
        ))
      : view.kind === "notice"
        ? [
            <p key={view.key} className="py-[10px] text-[13px] text-sapil-ink-2" role="status">
              {view.message}
            </p>,
          ]
        : [],
  );

  const estimate = session?.totalsEstimate;
  const rows: SummaryTotalRow[] = [{ key: "sub", label: t("checkout.subtotal"), value: money(f.subtotal, currency) }];
  if (f.discount > 0) {
    rows.push({ key: "disc", label: t("checkout.discount"), sub: applied?.code, value: `−${money(f.discount, currency)}`, tone: "save" });
  }
  if (estimate) {
    rows.push({
      key: "ship",
      label: t("checkout.delivery"),
      value: f.shippingFee > 0 ? money(f.shippingFee, currency) : t("checkout.deliveryFree"),
    });
  }
  if (f.shipDiscount > 0) {
    rows.push({ key: "shipdisc", label: t("checkout.deliveryDiscount"), value: `−${money(f.shipDiscount, currency)}`, tone: "save" });
  }
  const taxDisplay = session?.context?.taxDisplay;
  const taxIncluded = taxDisplay?.pricesIncludeTax === true;
  const taxLabel = taxDisplay?.taxLabel || "VAT";
  if (f.tax > 0 && !taxIncluded) rows.push({ key: "tax", label: taxLabel, value: money(f.tax, currency) });
  const payable = f.amountPayable ?? f.total;
  // The checkout session's own quote wins over the cart's stored one.
  const sessionPointsQuote = readLoyaltyRedemption(f.promoSnapshot, session?.promotionSnapshot, session?.promotions);
  const showPayable = f.amountPayable != null && f.amountPayable !== f.total;
  if (showPayable) {
    rows.push({ key: "total", label: t("checkout.total"), value: money(f.total, currency) });
    for (const card of f.giftCards) {
      const amount = Number(card.amount);
      if (amount > 0) {
        rows.push({
          key: `gc-${card.usageId ?? card.maskedCode}`,
          label: t("checkout.giftCard", { code: card.maskedCode ?? "" }),
          value: `−${money(amount, card.currencyCode || currency)}`,
          tone: "save",
        });
      }
    }
    // Reward points are a tender too: without this row the gap between the
    // total and what the payment method collects goes unexplained.
    const points = loyaltyLineFromQuote(sessionPointsQuote ?? cartLoyalty);
    if (points && points.amount > 0) {
      rows.push({
        key: "points",
        label: t("checkout.rewardPoints", { points: points.points }),
        value: `−${money(points.amount, points.currency || currency)}`,
        tone: "save",
      });
    }
  }
  const grandParts = moneyParts(payable, currency);
  const trust = [t("checkout.trustSecure")];
  const freeOver = marketDelivery.freeDeliveryThreshold ?? ship.threshold;
  if (freeOver) {
    trust.push(t("checkout.trustFreeOver", { amount: money(freeOver, marketDelivery.currency ?? ship.currency) }));
  }

  /* ——— shipping + payment data ——— */
  const deliveryTitles = deliveryOptionTitles(checkout.deliveryMethods);
  const deliveryOptions: RadioCardOption[] = checkout.deliveryMethods.map((method) => ({
    value: method.zoneDeliveryMethodId,
    title: deliveryTitles.get(method.zoneDeliveryMethodId) ?? method.displayName,
    description: etaText(method, t),
    fee: feeText(method, currency, money, t),
    disabled: f.submitting,
  }));

  // Only what this market offers: "coming soon" methods are not listed.
  const payGroups = payment.groups.filter((group) => group.id !== "more" && group.rows.length > 0);
  const payableText = money(payable, currency);

  function panelFor(row: PayRow): ReactNode {
    if (row.surface) {
      return payment.formReady(row) && checkout.inlinePayment ? (
        <SapilInlinePayment
          session={checkout.inlinePayment}
          surface={row.surface}
          email={f.email}
          name={f.shipping.fullName}
          phone={f.shipping.phone}
          country={f.countryCode}
          payLabel={t("checkout.payAmount", { amount: payableText })}
        />
      ) : (
        <p className="text-[14px] text-sapil-ink-2" role="status">
          {t("checkout.cardFormLoading")}
        </p>
      );
    }
    if (row.tabby !== undefined && !row.disabled && payable > 0) {
      return <SapilTabbyCard config={row.tabby || null} total={payable} currency={currency} lang={f.payLang} />;
    }
    return undefined;
  }

  const activeRow = payment.activeRow;
  const submitLabel = f.submitting
    ? t("checkout.placing")
    : payment.covered
      ? t("checkout.placeOrder", { amount: payableText })
      : f.ctaKind === "continue"
        ? t("checkout.continueToPay", { amount: payableText })
        : activeRow?.method && isCashMethod(activeRow.method)
          ? t("checkout.placeOrder", { amount: payableText })
          : t("checkout.payAmount", { amount: payableText });
  const payNowLabel = f.submitting
    ? t("checkout.placing")
    : activeRow?.surface === "apple_pay"
      ? t("checkout.payWithApple")
      : activeRow?.surface === "google_pay"
        ? t("checkout.payWithGoogle")
        : t("checkout.payAmount", { amount: payableText });

  const brand = getBrand();

  const couponMessage = coupon.fieldError
    ? { tone: "bad" as const, content: coupon.fieldError }
    : coupon.applied?.code
      ? {
          tone: "good" as const,
          content: (
            <>
              {richText(t("checkout.promoApplied"), { code: <b>{coupon.applied.code}</b> })}
              {coupon.appliedView?.label ? `: ${coupon.appliedView.label}` : ""}.{" "}
              <button type="button" className={cx(buttonClass("link"), "!text-[13px]")} onClick={() => void coupon.onRemove()} disabled={coupon.busy}>
                {coupon.removing ? t("checkout.promoRemoving") : t("checkout.promoRemove")}
              </button>
            </>
          ),
        }
      : null;

  return (
    <>
      <CheckoutTop />
      <Wrap className="grid grid-cols-[minmax(0,1.4fr)_minmax(280px,440px)] gap-[clamp(28px,4vw,48px)] items-start pb-[88px] max-900:flex max-900:flex-col max-900:items-stretch max-900:gap-[16px] max-900:pb-[56px]">
        <SummaryToggle open={f.summaryOpen} onToggle={() => f.setSummaryOpen((open) => !open)} total={payableText} />
        <div className="min-w-0 max-900:order-3">
          <GooglePlacesProvider>
            <form id="checkout-form" noValidate onSubmit={onSubmit} className="flex flex-col gap-[20px]">
              <MissThisRow products={f.missThis} canAdd={f.canAddToOrder} onAdd={(product) => f.addFromCheckout(product)} />
              <DeliverySection
                email={f.email}
                onEmail={(value) => {
                  f.setEmail(value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                address={f.shipping}
                onField={setShippingField}
                onPlace={(parsed) => applyGooglePlace(f.setShipping, parsed, f.countryCode)}
                dialCode={dialCode}
                errors={errors}
                before={
                  f.testData ? (
                    <p className="flex items-center justify-between gap-[12px] mb-[16px] py-[8px] px-[12px] rounded-[12px] border border-dashed border-sapil-line-2 text-[13px] text-sapil-ink-2">
                      <span>{t("checkout.testData")}</span>
                      <button type="button" onClick={f.fillTestData} className={cx(buttonClass("link"), "!text-[13px] shrink-0")}>
                        {t("checkout.testDataFill")}
                      </button>
                    </p>
                  ) : null
                }
                {...region}
              />
              <ShippingMethodSection
                options={deliveryOptions}
                value={checkout.selectedDeliveryId}
                onChange={(id) => void checkout.chooseDelivery(id)}
                message={checkout.status === "loading" ? t("checkout.methodLoading") : t("checkout.methodNone")}
              />
              <BillingSection
                same={f.billingSame}
                onSame={f.setBillingSame}
                address={{ ...f.billing, phone: f.shipping.phone }}
                onField={setBillingField}
                onPlace={(parsed) => applyGooglePlace(f.setBilling, parsed, f.countryCode)}
                errors={billingErrors}
                {...region}
              />
              <PaymentSection
                groups={payGroups}
                activeKey={payment.activeKey}
                onPick={payment.pick}
                panelFor={panelFor}
                disabled={f.submitting}
                covered={payment.covered}
                emptyMessage={checkout.status === "loading" ? t("checkout.paymentLoading") : t("checkout.paymentNone")}
                kindsText={paymentKindsText(payKinds, f.payLang, t)}
                payNow={
                  payment.selectedOpensHere ? (
                    <CheckoutCta type="button" disabled={!f.canSubmit || f.submitting} onClick={payment.payNow}>
                      {payNowLabel}
                    </CheckoutCta>
                  ) : null
                }
              />

              {checkout.errorMsg ? (
                <p className="rounded-[14px] bg-sapil-p-peach py-[12px] px-[16px] text-[14px] text-sapil-sale" role="alert">
                  {checkout.errorMsg}
                  {checkout.status === "error" ? (
                    <>
                      {" "}
                      <button type="button" onClick={checkout.retry} className={cx(buttonClass("link"), "!text-[14px]")}>
                        {t("checkout.tryAgain")}
                      </button>
                    </>
                  ) : null}
                </p>
              ) : null}

              <CheckoutCta id="place-order" disabled={!f.canSubmit} hidden={payment.hideSubmit}>
                {submitLabel}
              </CheckoutCta>
              <p className="text-center text-[13px] text-sapil-muted">
                {richText(t("checkout.legal"), {
                  terms: (
                    <SapilLink href={brand.legal.terms} className="underline">
                      {t("checkout.terms")}
                    </SapilLink>
                  ),
                  privacy: (
                    <SapilLink href={brand.legal.privacy} className="underline">
                      {t("checkout.privacy")}
                    </SapilLink>
                  ),
                })}
              </p>
            </form>
          </GooglePlacesProvider>
        </div>

        <OrderSummary
            title={t("checkout.yourOrder")}
            sticky={false}
            open={f.summaryOpen}
            lines={summaryLines}
            extra={
              <>
                {giftLines}
                {f.leftOutCount > 0 ? (
                  <p className="mt-[10px] text-[13px] text-sapil-ink-2">{t("checkout.leftOut", { count: f.leftOutCount })}</p>
                ) : null}
              </>
            }
            promo={{
              value: coupon.value,
              onChange: coupon.setCode,
              onSubmit: (event) => void coupon.onApply(event),
              disabled: coupon.busy || !coupon.cartId,
              busy: coupon.busy,
              submitLabel: coupon.applying
                ? t("checkout.promoApplying")
                : coupon.applied?.code
                  ? t("checkout.promoReplace")
                  : t("checkout.promoApply"),
              message: couponMessage,
            }}
            rewards={
              <>
                <SapilPointsBox quoteOverride={sessionPointsQuote} />
                <GiftCardBox
                  cards={f.giftCards}
                  currency={currency}
                  checkoutSessionId={session?.checkoutSessionId}
                  onCheckoutSession={checkout.adoptSession}
                />
              </>
            }
            rows={rows}
            grand={{ label: showPayable ? t("checkout.toPay") : t("checkout.total"), ...grandParts }}
            vatNote={f.tax > 0 && taxIncluded ? t("checkout.taxIncluded", { amount: money(f.tax, currency), label: taxLabel }) : undefined}
            notes={
              <>
                <EarnNote preview={f.earnPreview.preview} />
                {f.warnings.map((warning) => (
                  <p key={warning} className="mt-[10px] text-[13px] text-sapil-ink-2" role="status">
                    {warning}
                  </p>
                ))}
              </>
            }
            trust={trust}
            LinkComponent={SapilLink}
          />
      </Wrap>
    </>
  );
}
