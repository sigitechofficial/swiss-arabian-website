"use client";

import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { listCustomerAddresses } from "@/features/account/api/customerAccount.service";
import { addItemOptimistic } from "@/features/cart/api/optimisticCart";
import { type CatalogProduct } from "@/features/catalog/constants/catalogProducts";
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
import {
  regionsForCountry,
  matchCountryRegion,
  normalizeCountryCode,
} from "@/features/account/data/regionsByCountry";
import { useMarket } from "@/providers/MarketProvider";
import {
  readEmployeeCheckout,
  staffDiscountPaymentBlocked,
} from "@/features/employeeBenefits/types/employeeCheckout";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import { trackPromotion } from "@/features/promotions/utils/promotionAnalytics";
import { env } from "@/lib/config/env";
import { useCheckout } from "./useCheckout";
import { useTabbyPrescore } from "./useTabbyPrescore";
import { useTabbyLang } from "./useTabbyLang";
import { isTabbyPaymentMethod } from "../utils/tabby";
import type { AddressFields } from "../utils/addressSnapshot";
import { checkoutWarningMessages } from "../utils/checkoutIssues";
import { isStripePaymentMethod } from "../utils/methodLabels";
import { checkoutTestDataFor } from "../utils/checkoutTestData";

export const EMPTY_ADDRESS: AddressFields = {
  fullName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  emirate: "",
  postalCode: "",
};

export function applyGooglePlace(
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

/**
 * Everything the checkout page holds besides its markup: the shopper's contact
 * and addresses (prefilled from the signed-in profile), the bag lines that are
 * part of the session, the server quote (totals, promotions, gift cards),
 * Tabby pre-scoring, and the submit handler. Shared by every brand's checkout;
 * every number comes from the checkout API.
 */
export function useCheckoutForm() {
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
  // Test sites only: one click fills the guest form for a UAE / KSA test order.
  const testData = checkoutTestDataFor({
    appEnv: env.appEnv,
    isAuthenticated,
    countryCode,
  });

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

  if (
    shipping.emirate &&
    regionSet &&
    !regionSet.regions.includes(shipping.emirate)
  ) {
    setShipping((prev) => ({
      ...prev,
      emirate: matchCountryRegion(countryCode, prev.emirate),
    }));
  }
  if (
    billing.emirate &&
    regionSet &&
    !regionSet.regions.includes(billing.emirate)
  ) {
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
      [defaultAddress?.firstName, defaultAddress?.lastName]
        .filter(Boolean)
        .join(" ");
    setEmail((prev) => prev || profileEmail);
    setShipping((prev) => ({
      fullName: prev.fullName || savedName || user.fullName || "",
      phone: prev.phone || defaultAddress?.phoneE164 || user.phoneE164 || "",
      address1: prev.address1 || defaultAddress?.address1 || "",
      address2: prev.address2 || defaultAddress?.address2 || "",
      city: prev.city || defaultAddress?.city || "",
      emirate:
        prev.emirate ||
        matchCountryRegion(countryCode, defaultAddress?.province),
      postalCode: prev.postalCode || defaultAddress?.postalCode || "",
    }));
  }

  const visibleLines = useMemo(
    () => (hydrated ? lines : []),
    [hydrated, lines],
  );
  // Only API-backed lines are part of the checkout session. Local-only lines
  // (static catalogue items with no SKU) would never reach the order.
  const orderableLines = useMemo(
    () => visibleLines.filter((line) => line.cartItemId),
    [visibleLines],
  );
  // Last non-empty lines: the cart is cleared once the order is placed, but
  // the summary keeps showing them while payment completes.
  const [lastOrderableLines, setLastOrderableLines] = useState(orderableLines);
  if (orderableLines.length && lastOrderableLines !== orderableLines) {
    setLastOrderableLines(orderableLines);
  }
  const payingInline = Boolean(checkout.inlinePayment);
  const summaryLines = orderableLines.length
    ? orderableLines
    : payingInline || checkout.status === "submitting"
      ? lastOrderableLines
      : orderableLines;
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
  }, [
    session?.checkoutSessionId,
    session?.context?.zoneCode,
    catalogContext?.zoneCode,
  ]);
  const estimate = session?.totalsEstimate;
  const marketCurrency = useMarketCurrency();
  const currency = session?.currency ?? cartCurrency ?? marketCurrency;
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

  // Tabby pre-scoring: on entry, and again when the email, phone or total changes.
  const payLang = useTabbyLang();
  const tabbyMethod = checkout.paymentMethods.find((m) => isTabbyPaymentMethod(m));
  const tabbyPrescore = useTabbyPrescore({
    checkoutSessionId: session?.checkoutSessionId,
    enabled: Boolean(tabbyMethod) && !covered,
    email,
    phone: shipping.phone ?? "",
    total: amountPayable ?? total,
  });
  const tabbyRejected = tabbyPrescore.state === "rejected";
  const tabbySelected = Boolean(selectedPayment && isTabbyPaymentMethod(selectedPayment));
  // Tabby can't approve this shopper: move the selection to another method.
  const { paymentMethods, choosePayment } = checkout;
  useEffect(() => {
    if (!tabbyRejected || !tabbySelected) return;
    const other =
      paymentMethods.find((m) => !isTabbyPaymentMethod(m) && m.isDefault) ??
      paymentMethods.find((m) => !isTabbyPaymentMethod(m));
    if (other) void choosePayment(other.zonePaymentMethodId);
  }, [tabbyRejected, tabbySelected, paymentMethods, choosePayment]);
  const staffPaymentBlocked = staffDiscountPaymentBlocked(
    readEmployeeCheckout(session?.staffPurchase ?? session?.employeeCheckout),
  );
  const canSubmit =
    checkout.status === "ready" &&
    !staffPaymentBlocked &&
    // Never submit with a Tabby option Tabby has already declined.
    !(tabbyRejected && tabbySelected && !covered) &&
    Boolean(
      checkout.selectedDeliveryId && (covered || checkout.selectedPaymentId),
    );
  /** What the submit button does: the view words it. */
  const ctaKind: "submitting" | "place" | "continue" = submitting
    ? "submitting"
    : covered
      ? "place"
      : selectedPayment &&
          (selectedPayment.requiresRedirect ||
            isStripePaymentMethod(selectedPayment))
        ? "continue"
        : "place";

  const isEmpty =
    hydrated && visibleLines.length === 0 && !submitting && !payingInline;
  const nothingOrderable =
    hydrated && visibleLines.length > 0 && orderableLines.length === 0;
  const hasUnavailable = visibleLines.some((line) => line.isSellable === false);
  const showLayout =
    hydrated &&
    summaryLines.length > 0 &&
    !hasUnavailable &&
    (orderableLines.length > 0 || payingInline || submitting);

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


  function fillTestData() {
    if (!testData) return;
    setEmail(testData.email);
    setShipping({ ...testData.shipping });
    setBillingSame(true);
  }

  return {
    hydrated,
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
    savedAddresses,
    visibleLines,
    orderableLines,
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
    selectedPayment,
    submitting,
    covered,
    payLang,
    tabbyPrescore,
    tabbyRejected,
    staffPaymentBlocked,
    canSubmit,
    ctaKind,
    isEmpty,
    nothingOrderable,
    hasUnavailable,
    showLayout,
    payingInline,
    bindShipping,
    bindBilling,
    applyPlaceToShipping: (parsed: ParsedStreetAddress) =>
      applyGooglePlace(setShipping, parsed, countryCode),
    applyPlaceToBilling: (parsed: ParsedStreetAddress) =>
      applyGooglePlace(setBilling, parsed, countryCode),
    handleSubmit,
  };
}
