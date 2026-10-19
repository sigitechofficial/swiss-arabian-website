"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useQuery } from "@tanstack/react-query";
import { listCustomerAddresses } from "@/features/account/api/customerAccount.service";
import { MissThisSwiper } from "@/features/cart/components/MissThisSwiper";
import { addItemOptimistic } from "@/features/cart/api/optimisticCart";
import { type CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  checkoutCrumbsList,
  collectionHeadFlush,
  collectionTitle,
  crumbs,
  doneTitle,
  pageTitle,
  stateEyebrow,
  stateIntro,
} from "@/styles/shopChrome";
import { pageContainer } from "@/styles/siteChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutDone,
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
import { MERCH_RAIL_SLUGS, useMerchRail } from "@/features/merchandising";
import {
  amountPayableFrom,
  checkoutQuoteSnapshot,
  shippingDiscountAmount,
  visibleGiftCards,
} from "@/features/promotions";
import { useEarnPreview } from "@/features/loyalty/hooks/useEarnPreview";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { regionsForCountry, matchCountryRegion, normalizeCountryCode } from "@/features/account/data/regionsByCountry";
import { useMarket } from "@/providers/MarketProvider";
import { useCheckout } from "../hooks/useCheckout";
import { GooglePlacesProvider } from "@/lib/google/GooglePlacesProvider";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import type { AddressFields } from "../utils/addressSnapshot";
import { trackPromotion } from "@/features/promotions/utils/promotionAnalytics";
import { checkoutWarningMessages } from "../utils/checkoutIssues";
import { isStripePaymentMethod } from "../utils/methodLabels";
import { CheckoutBilling } from "./checkout/CheckoutBilling";
import { CheckoutDelivery } from "./checkout/CheckoutDelivery";
import { CheckoutPayment } from "./checkout/CheckoutPayment";
import { CheckoutShippingMethod } from "./checkout/CheckoutShippingMethod";
import { CheckoutSummary } from "./checkout/CheckoutSummary";

const EMPTY_ADDRESS: AddressFields = {
  fullName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  emirate: "",
  postalCode: "",
};

function applyGooglePlace(
  setter: (update: (prev: AddressFields) => AddressFields) => void,
  parsed: ParsedStreetAddress,
  countryCode: string,
) {
  const country = parsed.countryCode || countryCode;
  setter((prev) => ({
    ...prev,
    address1: parsed.address1 || prev.address1,
    address2: parsed.address2 || prev.address2,
    city: parsed.city || prev.city,
    emirate:
      matchCountryRegion(country, parsed.province, parsed.city) ||
      parsed.province ||
      prev.emirate,
    postalCode: parsed.postalCode || prev.postalCode,
  }));
}

export function CheckoutPageView() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const cartSubtotal = useCartStore((s) => s.subtotal());
  const cartCurrency = useCartStore((s) => s.totals?.currency);
  const cartPromotions = useCartStore((s) => s.promotions);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkout = useCheckout();
  const dontMissRail = useMerchRail(MERCH_RAIL_SLUGS.checkoutDontMiss);
  const { catalogContext } = useMarket();
  const countryCode =
    normalizeCountryCode(catalogContext?.countryCode) ||
    normalizeCountryCode(checkout.session?.context?.countryCode) ||
    "AE";
  const regionSet = regionsForCountry(countryCode);
  const countryKeyRef = useRef(countryCode);

  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState<AddressFields>(EMPTY_ADDRESS);
  const [billing, setBilling] = useState<AddressFields>(EMPTY_ADDRESS);
  const [billingSame, setBillingSame] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Header/market country changed — drop the previous country's city/region
  // so the emirate dropdown never keeps e.g. Doha on UAE.
  useEffect(() => {
    if (countryKeyRef.current === countryCode) return;
    countryKeyRef.current = countryCode;
    const resetLocation = (prev: AddressFields): AddressFields => {
      const emirate = matchCountryRegion(countryCode, prev.emirate);
      if (emirate) return { ...prev, emirate };
      return {
        ...prev,
        address1: "",
        address2: "",
        city: "",
        emirate: "",
        postalCode: "",
      };
    };
    setShipping(resetLocation);
    setBilling(resetLocation);
  }, [countryCode]);

  const { data: savedAddresses } = useQuery({
    queryKey: ["checkout", "saved-addresses", user?.id ?? "guest"],
    queryFn: listCustomerAddresses,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const defaultAddress =
    savedAddresses?.find((a) => a.isDefaultShipping) ?? savedAddresses?.[0];

  if (shipping.emirate && regionSet && !regionSet.regions.includes(shipping.emirate)) {
    setShipping((prev) => ({
      ...prev,
      emirate: matchCountryRegion(countryCode, prev.emirate),
    }));
  }
  if (billing.emirate && regionSet && !regionSet.regions.includes(billing.emirate)) {
    setBilling((prev) => ({
      ...prev,
      emirate: matchCountryRegion(countryCode, prev.emirate),
    }));
  }

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
      emirate: prev.emirate || matchCountryRegion(countryCode, defaultAddress?.province),
      postalCode: prev.postalCode || defaultAddress?.postalCode || "",
    }));
  }

  const visibleLines = hydrated ? lines : [];
  // Only API-backed lines are part of the checkout session. Local-only lines
  // (static catalogue items with no SKU) would never reach the order.
  const orderableLines = visibleLines.filter((line) => line.cartItemId);
  const leftOutCount = visibleLines.length - orderableLines.length;

  // Always show the "Don't miss this" picks. Only products with a
  // live SKU or variant can join the checkout session, so the rest stay visible
  // with a disabled add button — never added locally and silently left out.
  const inCart = new Set(visibleLines.map((l) => l.slug).filter(Boolean));
  const upsells = dontMissRail.filter((p) => !inCart.has(p.slug));
  const canAddToOrder = (p: CatalogProduct) => Boolean(p.sku || p.variantId);
  const missThis = upsells.slice(0, 4);

  const session = checkout.session;
  const checkoutTracked = useRef("");
  useEffect(() => {
    const id = session?.checkoutSessionId;
    if (!id || checkoutTracked.current === id) return;
    checkoutTracked.current = id;
    trackPromotion("promotion_checkout_started", {
      market: session?.context?.zoneCode ?? catalogContext?.zoneCode ?? null,
      surface: "checkout",
    });
  }, [session?.checkoutSessionId, session?.context?.zoneCode, catalogContext?.zoneCode]);
  const estimate = session?.totalsEstimate;
  const currency = session?.currency ?? cartCurrency ?? "AED";
  const subtotal = estimate ? Number(estimate.subtotal) : cartSubtotal;
  const shippingFee = estimate ? Number(estimate.shipping) : 0;
  const discount = estimate ? Number(estimate.discount) : 0;
  const tax = estimate ? Number(estimate.tax) : 0;
  const total = estimate ? Number(estimate.total) : cartSubtotal;
  const promoSnapshot = checkoutQuoteSnapshot(session, cartPromotions);
  const shipDiscount = shippingDiscountAmount(promoSnapshot);
  const giftCards = visibleGiftCards(promoSnapshot, session?.giftCards);
  const amountPayable = amountPayableFrom(
    session ? checkoutQuoteSnapshot(session, null) : null,
    [estimate?.amountPayable],
  );
  const warnings = checkoutWarningMessages(session?.validationIssues);
  const earnPreview = useEarnPreview({
    checkoutSessionId: session?.checkoutSessionId,
  });

  const selectedPayment = checkout.paymentMethods.find(
    (m) => m.zonePaymentMethodId === checkout.selectedPaymentId,
  );
  const submitting = checkout.status === "submitting";
  const covered = amountPayable === 0;
  const canSubmit =
    checkout.status === "ready" &&
    Boolean(checkout.selectedDeliveryId && (covered || checkout.selectedPaymentId));
  const ctaLabel = submitting
    ? "Placing order…"
    : covered
      ? "Place order"
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
    <div>
      <section className={collectionHeadFlush} aria-labelledby="checkout-heading">
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
              <form className={checkoutForm} noValidate onSubmit={handleSubmit}>
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
                  onPhone={(phone) => setShipping((prev) => ({ ...prev, phone }))}
                  onAddress1={(value) => setShipping((prev) => ({ ...prev, address1: value }))}
                  onPlace={(parsed) => applyGooglePlace(setShipping, parsed, countryCode)}
                  countryCode={countryCode}
                  regionSet={regionSet}
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
                  onAddress1={(value) => setBilling((prev) => ({ ...prev, address1: value }))}
                  onPlace={(parsed) => applyGooglePlace(setBilling, parsed, countryCode)}
                  countryCode={countryCode}
                  regionSet={regionSet}
                />
                <CheckoutPayment
                  methods={checkout.paymentMethods}
                  selectedId={checkout.selectedPaymentId}
                  status={checkout.status}
                  submitting={submitting}
                  errorMsg={checkout.errorMsg}
                  onRetry={checkout.retry}
                  onSelect={(id) => void checkout.choosePayment(id)}
                  canSubmit={canSubmit}
                  ctaLabel={ctaLabel}
                  amountPayable={amountPayable}
                />
              </form>
              </GooglePlacesProvider>

              <CheckoutSummary
                open={summaryOpen}
                orderableLines={orderableLines}
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

          {redirecting ? (
            <section className={checkoutDone} aria-live="polite">
              <span className="mb-4 size-8 animate-spin rounded-full border-2 border-[var(--copper,#8c4435)]/25 border-t-[var(--copper,#8c4435)]" aria-hidden="true" />
              <p className={stateEyebrow}>Order placed</p>
              <h2 className={collectionTitle}>Taking you to payment…</h2>
              <p className={stateIntro}>Please don’t close or refresh this page.</p>
            </section>
          ) : null}

          {nothingOrderable ? (
            <section className={checkoutEmpty}>
              <p className={stateEyebrow}>Can’t check out yet</p>
              <h2 className={doneTitle}>These items can’t be ordered online.</h2>
              <p>Please return to your bag and add them again from the collection.</p>
              <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/cart">
                <span>Back to bag</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            </section>
          ) : null}

          {isEmpty ? (
            <section className={checkoutEmpty} id="checkout-empty">
              <p className={stateEyebrow}>Empty bag</p>
              <h2 className={doneTitle}>Nothing to check out yet.</h2>
              <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/products">
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
