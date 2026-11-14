"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { useBag } from "@/features/cart/hooks/useBag";
import { useMarketDelivery } from "@/features/markets/hooks/useMarketDelivery";
import { SapilInlinePayment, SapilTabbyCard } from "../../components/checkout/SapilInlinePayment";
import { useCheckoutForm } from "@/features/checkout/hooks/useCheckoutForm";
import { usePaymentOptions } from "@/features/checkout/hooks/usePaymentOptions";
import type { DeliveryMethodOption } from "@/features/checkout/types/checkout";
import { usesHostedRedirect } from "@/features/checkout/utils/methodLabels";
import type { PayRow } from "@/features/checkout/utils/paymentOptions";
import { isTabbyPaymentMethod } from "@/features/checkout/utils/tabby";
import { appliedCoupon, useFreeShippingBar } from "@/features/promotions";
import { useCouponForm } from "@/features/promotions/hooks/useCouponForm";
import { useGiftAwards } from "@/features/promotions/hooks/useGiftAwards";
import { getBrand } from "@/lib/brand";
import { loyaltyLineFromQuote } from "@/features/loyalty/hooks/useLoyaltyRedemption";
import { readLoyaltyRedemption } from "@/features/loyalty/types/loyalty";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { Button, CardLogo, Checkbox, Fieldset, RadioCardGroup, Wrap, type RadioCardOption } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { linePriceParts, lineHref } from "../../components/bag/bagData";
import {
  AddressFieldset,
  CheckoutEmptyCard,
  CheckoutHeader,
  ContactFieldset,
  DeliveryMethodFieldset,
  NextButton,
  OrderSummary,
  ReviewBlock,
  SummaryToggle,
  type AddressErrors,
  type AddressValue,
  type CheckoutStepKey,
  type SummaryLine,
  type SummaryTotalRow,
} from "../../components/checkout/CheckoutParts";
import { isValidMobile } from "../../components/commerce/SapilPhoneField";
import {
  DEFAULT_TILE,
  SapilLink,
  SapilSkeleton,
  richText,
  useSapilMoney,
  useSapilMoneyParts,
  type SapilMoney,
} from "../../components/commerce/shared";
import { useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import { regionLabel as regionName } from "@/features/account/utils/addressDisplay";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function dialCodeFor(country: string): string {
  try {
    return getCountryCallingCode(country.toUpperCase() as CountryCode);
  } catch {
    return "971";
  }
}

/** Client checks before the API sees the address (v9: inline message under each field). */
function validateDelivery(
  email: string,
  address: AddressValue,
  t: SapilTranslator,
  regionKey: "emirate" | "region",
  withContact = true,
): AddressErrors {
  const errors: AddressErrors = {};
  if (withContact && !EMAIL.test(email.trim())) errors.email = t("checkout.emailError");
  if (withContact && !isValidMobile(address.phone)) errors.phone = t("checkout.phoneError");
  if (!address.fullName.trim()) errors.fullName = t("checkout.fullNameError");
  if (!address.emirate) errors.emirate = regionKey === "emirate" ? t("checkout.emirateError") : t("checkout.regionError");
  if (!address.city.trim()) errors.city = t("checkout.areaError");
  if (!address.address1.trim()) errors.address1 = t("checkout.streetError");
  return errors;
}

const FIELD_ORDER: Array<keyof AddressErrors> = ["email", "phone", "fullName", "emirate", "city", "address1"];
const FIELD_IDS: Record<keyof AddressErrors, string> = {
  email: "co-email",
  phone: "co-phone",
  fullName: "ship-name",
  emirate: "ship-region",
  city: "ship-area",
  address1: "ship-street",
};

function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function etaText(method: DeliveryMethodOption, t: SapilTranslator): string | undefined {
  const min = method.metadata?.estimatedMinDays;
  const max = method.metadata?.estimatedMaxDays;
  if (typeof min === "number" && typeof max === "number" && min !== max) return t("checkout.etaRange", { min, max });
  const days = typeof max === "number" ? max : min;
  return typeof days === "number" ? t("checkout.etaDays", { count: days }) : undefined;
}

/** A missing fee means "not priced yet" (backend guide: free / TBD), so no price is shown; only an explicit 0 is "Free". */
function feeText(method: DeliveryMethodOption, currency: string, money: SapilMoney, t: SapilTranslator): string | undefined {
  if (method.estimatedFee == null || method.estimatedFee.trim() === "") return undefined;
  const fee = Number(method.estimatedFee);
  if (!Number.isFinite(fee)) return undefined;
  return fee > 0 ? money(fee, currency) : t("checkout.methodFree");
}

const CARD_PROVIDER_NAMES: Record<NonNullable<PayRow["provider"]>, string> = { stripe: "Stripe", paymob: "Paymob" };

/** `nameProvider`: more than one card option is on offer, so each one says whose it is. */
function payTitle(row: PayRow, t: SapilTranslator, nameProvider = false): string {
  if (row.kind === "card") {
    return nameProvider && row.provider
      ? t("checkout.payCardVia", { provider: CARD_PROVIDER_NAMES[row.provider] })
      : t("checkout.payCard");
  }
  if (row.kind === "apple_pay") return t("checkout.payApple");
  if (row.kind === "google_pay") return t("checkout.payGoogle");
  return row.method?.displayName ?? row.title;
}

function payNote(row: PayRow, t: SapilTranslator): string | undefined {
  if (row.kind === "card") return row.marks?.includes("amex") ? t("checkout.payCardBrands") : t("checkout.payCardBrandsShort");
  if (row.kind === "apple_pay") return t("checkout.payAppleNote");
  if (row.kind === "google_pay") return t("checkout.payGoogleNote");
  const method = row.method;
  if (!method) return row.sub;
  if (isTabbyPaymentMethod(method)) {
    if (row.tabbyState === "checking") return t("checkout.payTabbyChecking");
    if (row.tabbyState === "rejected") return row.tabbyMessage;
    return t("checkout.payTabbyNote");
  }
  if (/\bcod\b|cash/i.test(`${method.providerCode} ${method.methodCode} ${method.displayName}`)) return t("checkout.payCashNote");
  if (usesHostedRedirect(method)) return t("checkout.payRedirectNote");
  return undefined;
}

/** v9 checkout: delivery (contact, address, method) → payment, with the order summary beside it. */
export function SapilCheckoutPage() {
  const t = useSapilCopy();
  const shopT = useShopTranslator();
  const money = useSapilMoney();
  const moneyParts = useSapilMoneyParts();
  const f = useCheckoutForm();
  const bag = useBag();
  const coupon = useCouponForm();
  const ship = useFreeShippingBar();
  const marketDelivery = useMarketDelivery();
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const cartLoyalty = useCartStore((s) => s.loyaltyRedemption);
  const { checkout, session, currency } = f;
  const gifts = useGiftAwards(f.promoSnapshot, currency);

  const [step, setStep] = useState<CheckoutStepKey>("delivery");
  const [errors, setErrors] = useState<AddressErrors>({});
  const [billingErrors, setBillingErrors] = useState<AddressErrors>({});
  const deliveryHeading = useRef<HTMLHeadingElement>(null);
  const paymentHeading = useRef<HTMLHeadingElement>(null);

  const regionKey = f.countryCode === "AE" ? "emirate" : "region";
  const regionLabel = regionKey === "emirate" ? t("checkout.emirate") : t("checkout.region");
  const regionPlaceholder = regionKey === "emirate" ? t("checkout.emiratePlaceholder") : t("checkout.regionPlaceholder");
  const regions = f.regionSet?.regions ?? [];
  const dialCode = dialCodeFor(f.countryCode);

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

  function go(next: CheckoutStepKey) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    // Move focus to the new step's heading so screen readers hear where they are.
    window.requestAnimationFrame(() => (next === "payment" ? paymentHeading : deliveryHeading).current?.focus({ preventScroll: true }));
  }

  function checkDelivery(): boolean {
    const found = validateDelivery(f.email, f.shipping, t, regionKey);
    setErrors(found);
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) {
      if (step !== "delivery") setStep("delivery");
      window.requestAnimationFrame(() => focusField(FIELD_IDS[first]));
      return false;
    }
    return true;
  }

  function checkBilling(): boolean {
    if (f.billingSame) return true;
    const found = validateDelivery(f.email, { ...f.billing, phone: f.shipping.phone }, t, regionKey, false);
    setBillingErrors(found);
    const first = (["fullName", "emirate", "city", "address1"] as const).find((key) => found[key]);
    if (first) {
      const ids = { fullName: "bill-name", emirate: "bill-region", city: "bill-area", address1: "bill-street" };
      window.requestAnimationFrame(() => focusField(ids[first]));
      return false;
    }
    return true;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (step === "delivery") {
      event.preventDefault();
      if (checkDelivery()) go("payment");
      return;
    }
    if (!checkDelivery() || !checkBilling()) {
      event.preventDefault();
      return;
    }
    f.handleSubmit(event);
  }

  const setShippingField = (field: keyof AddressValue, value: string) => {
    f.setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof AddressErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const setBillingField = (field: keyof AddressValue, value: string) => {
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
        <SapilSkeleton className="h-[52px] w-[260px] mb-[20px]" />
        <SapilSkeleton className="h-[72px] mb-[24px] !rounded-[20px]" />
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[56px] max-900:grid-cols-[1fr]">
          <SapilSkeleton className="h-[420px] !rounded-[24px] max-900:h-[300px]" />
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
      <Wrap className="w-full pt-[24px] pb-[88px] max-900:pt-[16px] max-900:pb-[56px] min-h-[70vh]">
        <CheckoutEmptyCard title={title} body={body} actions={<Button href={href} LinkComponent={SapilLink}>{cta}</Button>} />
      </Wrap>
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
  const giftLines: ReactNode = gifts.views.flatMap((view) =>
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
    const points = loyaltyLineFromQuote(
      readLoyaltyRedemption(f.promoSnapshot, session?.promotionSnapshot, session?.promotions) ?? cartLoyalty,
    );
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

  /* ——— delivery + payment data ——— */
  const deliveryOptions: RadioCardOption[] = checkout.deliveryMethods.map((method) => ({
    value: method.zoneDeliveryMethodId,
    title: method.displayName,
    description: etaText(method, t),
    fee: feeText(method, currency, money, t),
    disabled: f.submitting,
  }));
  const selectedDelivery = checkout.deliveryMethods.find((m) => m.zoneDeliveryMethodId === checkout.selectedDeliveryId);

  const payRows = payment.groups.filter((group) => group.id !== "more").flatMap((group) => group.rows);
  const severalCards = payRows.filter((row) => row.kind === "card").length > 1;
  const payOptions: RadioCardOption[] = payRows.map((row) => {
    const active = row.key === payment.activeKey;
    let panel: ReactNode = undefined;
    if (active && row.surface) {
      panel =
        payment.formReady(row) && checkout.inlinePayment ? (
          <SapilInlinePayment
            session={checkout.inlinePayment}
            surface={row.surface}
            email={f.email}
            name={f.shipping.fullName}
            phone={f.shipping.phone}
            country={f.countryCode}
            payLabel={t("checkout.payAmount", { amount: money(payable, currency) })}
          />
        ) : (
          <p className="text-[14px] text-sapil-ink-2" role="status">
            {t("checkout.cardFormLoading")}
          </p>
        );
    } else if (active && row.tabby !== undefined && !row.disabled && payable > 0) {
      panel = <SapilTabbyCard config={row.tabby || null} total={payable} currency={currency} lang={f.payLang} />;
    }
    const isTabby = Boolean(row.method && isTabbyPaymentMethod(row.method));
    return {
      value: row.key,
      title: payTitle(row, t, severalCards),
      description: payNote(row, t),
      logos:
        row.kind === "card" ? (
          <>
            <CardLogo kind="visa" />
            <CardLogo kind="mastercard" />
          </>
        ) : isTabby ? (
          <CardLogo kind="tabby" />
        ) : undefined,
      panel,
      disabled: f.submitting || row.disabled,
    };
  });
  const activeRow = payment.activeRow;
  const payableText = money(payable, currency);
  const submitLabel = f.submitting
    ? t("checkout.placing")
    : payment.covered
      ? t("checkout.placeOrder", { amount: payableText })
      : f.ctaKind === "continue"
        ? t("checkout.continueToPay", { amount: payableText })
        : activeRow?.method && /\bcod\b|cash/i.test(`${activeRow.method.providerCode} ${activeRow.method.methodCode}`)
          ? t("checkout.placeOrder", { amount: payableText })
          : t("checkout.payAmount", { amount: payableText });

  const brand = getBrand();
  const address = f.shipping;
  const reviewRows = [
    {
      label: t("checkout.reviewContact"),
      value: (
        <>
          {f.email} · <span dir="ltr">{address.phone}</span>
        </>
      ),
      onChange: () => go("delivery"),
    },
    {
      label: t("checkout.reviewDeliverTo"),
      value: `${address.fullName}, ${[
        address.address2,
        address.address1,
        address.city,
        address.emirate ? regionName(f.countryCode, address.emirate, shopT) : "",
      ]
        .filter(Boolean)
        .join(", ")}`,
      onChange: () => go("delivery"),
    },
    ...(selectedDelivery
      ? [
          {
            label: t("checkout.reviewMethod"),
            value: [selectedDelivery.displayName, etaText(selectedDelivery, t)].filter(Boolean).join(" · "),
            onChange: () => go("delivery"),
          },
        ]
      : []),
  ];

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
      <CheckoutHeader
        step={step}
        bagHint={t("checkout.stepBagHint", { count: bag.itemCount, amount: money(f.subtotal, currency) })}
        onOpenBag={() => setCartOpen(true)}
      />
      <Wrap
        className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[56px] items-start pt-[24px] pb-[88px] max-900:grid-cols-[1fr] max-900:gap-[16px] max-900:pt-[16px] max-900:pb-[56px]"
      >
        <SummaryToggle
          open={f.summaryOpen}
          onToggle={() => f.setSummaryOpen((open) => !open)}
          total={money(payable, currency)}
        />
        <div className="min-w-0">
          <form id="checkout-form" noValidate onSubmit={onSubmit}>
            <div hidden={step !== "delivery"} className="flex flex-col gap-[20px]">
              <h2 ref={deliveryHeading} tabIndex={-1} className="sr-only">
                {t("checkout.stepDelivery")}
              </h2>
              <ContactFieldset
                email={f.email}
                onEmail={(value) => {
                  f.setEmail(value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                phone={address.phone}
                onPhone={(value) => setShippingField("phone", value)}
                dialCode={dialCode}
                errors={errors}
                before={
                  f.testData ? (
                    <p className="clear-both flex items-center justify-between gap-[12px] mb-[14px] py-[8px] px-[12px] rounded-[12px] border border-dashed border-sapil-line-2 text-[13px] text-sapil-ink-2">
                      <span>{t("checkout.testData")}</span>
                      <button type="button" onClick={f.fillTestData} className={cx(buttonClass("link"), "!text-[13px]")}>
                        {t("checkout.testDataFill")}
                      </button>
                    </p>
                  ) : null
                }
              />
              <AddressFieldset
                legend={t("checkout.address")}
                idPrefix="ship"
                value={address}
                onChange={setShippingField}
                regionLabel={regionLabel}
                regionPlaceholder={regionPlaceholder}
                regions={regions}
                countryCode={f.countryCode}
                errors={errors}
              />
              <DeliveryMethodFieldset
                options={deliveryOptions}
                value={checkout.selectedDeliveryId}
                onChange={(id) => void checkout.chooseDelivery(id)}
                message={checkout.status === "loading" ? t("checkout.methodLoading") : t("checkout.methodNone")}
              />
              <NextButton>{t("checkout.continue")}</NextButton>
              <SapilLink href="/products" className={cx(buttonClass("link"), "self-center !text-[14px]")}>
                {t("checkout.keepShopping")}
              </SapilLink>
            </div>

            <div hidden={step !== "payment"} className="flex flex-col gap-[20px]">
              <h2 ref={paymentHeading} tabIndex={-1} className="sr-only">
                {t("checkout.stepPayment")}
              </h2>
              <ReviewBlock rows={reviewRows} />
              <Fieldset legend={t("checkout.payment")}>
                <p className="clear-both text-[14px] text-sapil-ink-2 mt-[-6px] mb-[16px]">{t("checkout.paymentNote")}</p>
                {payment.covered ? (
                  <p className="text-[15px] text-sapil-ok">{t("checkout.paymentCovered")}</p>
                ) : payOptions.length ? (
                  <RadioCardGroup
                    name="payMethod"
                    aria-label={t("checkout.payment")}
                    options={payOptions}
                    value={payment.activeKey ?? undefined}
                    onValueChange={(key) => {
                      const row = payRows.find((r) => r.key === key);
                      if (row) payment.pick(row);
                    }}
                  />
                ) : (
                  <p className="text-[14px] text-sapil-ink-2" role="status">
                    {checkout.status === "loading" ? t("checkout.paymentLoading") : t("checkout.paymentNone")}
                  </p>
                )}
                <Checkbox checked={f.billingSame} onChange={(event) => f.setBillingSame(event.target.checked)}>
                  {t("checkout.billingSame")}
                </Checkbox>
              </Fieldset>
              {!f.billingSame ? (
                <AddressFieldset
                  legend={t("checkout.billing")}
                  idPrefix="bill"
                  value={{ ...f.billing, phone: address.phone }}
                  onChange={setBillingField}
                  regionLabel={regionLabel}
                  regionPlaceholder={regionPlaceholder}
                  regions={regions}
                  countryCode={f.countryCode}
                  errors={billingErrors}
                />
              ) : null}
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
              {payment.covered || !payment.hideSubmit ? (
                <NextButton disabled={!f.canSubmit} arrow={false}>
                  {submitLabel}
                </NextButton>
              ) : payment.selectedOpensHere ? (
                <NextButton type="button" disabled={!f.canSubmit || f.submitting} onClick={payment.payNow} arrow={false}>
                  {f.submitting ? t("checkout.placing") : t("checkout.payAmount", { amount: payableText })}
                </NextButton>
              ) : null}
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
              <button type="button" onClick={() => go("delivery")} className={cx(buttonClass("link"), "self-center !text-[14px]")}>
                {t("checkout.backToDelivery")}
              </button>
            </div>
          </form>
        </div>

        <OrderSummary
          open={f.summaryOpen}
          lines={summaryLines}
          onQuantity={(key, quantity) => {
            const line = f.summaryLines.find((l) => (l.cartItemId ?? l.variantId) === key);
            if (!line) return;
            if (quantity < 1) bag.removeLine(line);
            else bag.setLineQuantity(line, quantity);
          }}
          extra={giftLines}
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
          rows={rows}
          grand={{ label: showPayable ? t("checkout.toPay") : t("checkout.total"), ...grandParts }}
          vatNote={f.tax > 0 && taxIncluded ? t("checkout.taxIncluded", { amount: money(f.tax, currency), label: taxLabel }) : undefined}
          notes={
            <>
              {f.leftOutCount > 0 ? (
                <p className="mt-[10px] text-[13px] text-sapil-ink-2">{t("checkout.leftOut", { count: f.leftOutCount })}</p>
              ) : null}
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
