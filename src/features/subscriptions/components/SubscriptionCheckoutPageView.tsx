"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { listCustomerAddresses, createCustomerAddress } from "@/features/account/api/customerAccount.service";
import type { StorefrontCustomerAddressView } from "@/features/account/types/customerAccount";
import { matchCountryRegion, normalizeCountryCode, regionsForCountry } from "@/features/account/data/regionsByCountry";
import { CheckoutDelivery } from "@/features/checkout/components/checkout/CheckoutDelivery";
import { CheckoutShippingMethod } from "@/features/checkout/components/checkout/CheckoutShippingMethod";
import type { DeliveryMethodOption } from "@/features/checkout/types/checkout";
import type { AddressFields } from "@/features/checkout/utils/addressSnapshot";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { localizeHref } from "@/lib/i18n/localePath";
import { GooglePlacesProvider } from "@/lib/google/GooglePlacesProvider";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import { useMarket } from "@/providers/MarketProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  cbox,
  cboxHead,
  checkoutBadges,
  checkoutCta,
  checkoutError,
  checkoutForm,
  checkoutHead,
  checkoutLayout,
  checkoutLegal,
  checkoutLines,
  checkoutStepCurrent,
  checkoutSteps,
  checkoutSummary,
  checkoutSummaryChevron,
  checkoutSummaryOpen,
  checkoutSummaryToggle,
  checkoutSummaryToggleTotal,
  checkoutTotals,
  checkoutTotalsLine,
  coline,
  colineBody,
  colineMedia,
  colineMeta,
  colineName,
  colinePrice,
  colineTop,
  fldCheck,
  fldFull,
  fldSelect,
  payOpt,
  payOptActive,
  payOptNote,
  payOptTitle,
  payOptions,
  stripePayCta,
  stripePayForm,
} from "@/styles/checkoutChrome";
import { checkoutCrumbsList, collectionHeadFlush, crumbs, pageTitle } from "@/styles/shopChrome";
import { pageContainer } from "@/styles/siteChrome";

import {
  beginSubscriptionCheckout,
  getSubscriptionConsent,
  getMySubscription,
  listSubscriptionDeliveryMethods,
  listSubscriptionPlans,
  readSubscriptionCheckout,
  registerSubscription,
  type SubscriptionCheckoutView,
} from "../api/subscription.api";
import { subscriptionKeys } from "../api/subscription.keys";
import {
  activeRegistrationConsent,
  buildRegisterBody,
  registrationFingerprint,
  registrationIdempotencyKey,
} from "../utils/subscriptionRules";
import { SubscriptionCheckoutSuccess } from "./SubscriptionCheckoutSuccess";
import { SubscriptionMonthlyTracker } from "./SubscriptionMonthlyTracker";
import {
  beginCheckoutBody,
  lockedCheckoutAddress,
  shouldBeginSubscriptionCheckout,
  subscriptionCheckoutPath,
  subscriptionCheckoutResultCopy,
  subscriptionCheckoutSucceeded,
  subscriptionCheckoutTestKey,
  subscriptionDeliveryChoices,
  subscriptionPayToday,
} from "../utils/subscriptionCheckout";

const EMPTY_ADDRESS: AddressFields = {
  fullName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  emirate: "",
  postalCode: "",
};

function draftFor(planCode: string): { mode: "SURPRISE" | "QUEUE"; selected: string[]; audience: "MEN" | "WOMEN" } {
  const raw = sessionStorage.getItem(`sa-sub-draft:${planCode}`) ?? "";
  try {
    const parsed = JSON.parse(raw) as { mode?: string; selected?: unknown; audience?: string };
    const selected = Array.isArray(parsed.selected)
      ? parsed.selected.filter((id): id is string => typeof id === "string")
      : [];
    return {
      mode: parsed.mode === "SURPRISE" ? "SURPRISE" : "QUEUE",
      selected,
      audience: parsed.audience === "MEN" ? "MEN" : "WOMEN",
    };
  } catch {
    return { mode: "QUEUE", selected: [], audience: "WOMEN" };
  }
}

function PayForm({
  onConfirmed,
}: {
  onConfirmed: () => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) {
      setError(result.error.message ?? "Payment was not confirmed.");
      setBusy(false);
      return;
    }
    await onConfirmed();
    setBusy(false);
  }

  return (
    <div className={`${stripePayForm} mt-4 flex flex-col`}>
      <PaymentElement />
      {error ? <p className={checkoutError} role="alert">{error}</p> : null}
      <button type="button" className={`${checkoutCta} ${stripePayCta}`} disabled={!stripe || !elements || busy} onClick={() => void confirm()}>
        <span>{busy ? "Processing…" : "Pay today"}</span>
        <b aria-hidden="true">↗</b>
      </button>
    </div>
  );
}

export function SubscriptionCheckoutPageView({ planCode }: { planCode: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const authed = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode || state.selectedMarketId || "");
  const { catalogContext } = useMarket();
  const countryCode = normalizeCountryCode(catalogContext?.countryCode) || "AE";
  const regionSet = regionsForCountry(countryCode);
  const plans = useApiQuery(subscriptionKeys.plans(zoneCode), () => listSubscriptionPlans(zoneCode), { enabled: Boolean(zoneCode) });
  const consent = useApiQuery(subscriptionKeys.consent(zoneCode), () => getSubscriptionConsent(zoneCode), { enabled: Boolean(zoneCode) });
  const addresses = useApiQuery(["subscription-checkout", "addresses"], listCustomerAddresses, { enabled: authed });
  const plan = (plans.data ?? []).find((item) => item.planCode === planCode) ?? null;
  const activeConsent = activeRegistrationConsent(consent.data);
  const storedAgreementId = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem(`sa-sub-agreement:${planCode}`) ?? "",
    () => "",
  );
  const [createdAgreementId, setCreatedAgreementId] = useState("");
  const agreementId = createdAgreementId || storedAgreementId;
  const savedAgreement = useApiQuery(
    subscriptionKeys.detail(agreementId, zoneCode),
    () => getMySubscription(agreementId, zoneCode),
    { enabled: Boolean(agreementId && zoneCode && authed) },
  );
  const addressLock = lockedCheckoutAddress(savedAgreement.data?.customerAddressId);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shipping, setShipping] = useState<AddressFields>(EMPTY_ADDRESS);
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethodOption[]>([]);
  const [deliveryMethodsLoaded, setDeliveryMethodsLoaded] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<SubscriptionCheckoutView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [filledLock, setFilledLock] = useState<string | null>(null);
  const [filledEmail, setFilledEmail] = useState(false);
  const posted = useRef(false);
  const opening = useRef(false);
  const selectedMethod = deliveryMethods.find((method) => method.zoneDeliveryMethodId === selectedDeliveryId) ?? null;

  useEffect(() => {
    if (!zoneCode || !authed) return;
    let cancelled = false;
    listSubscriptionDeliveryMethods(zoneCode, countryCode)
      .then((methods) => {
        if (!cancelled) setDeliveryMethods(methods);
      })
      .catch(() => {
        if (!cancelled) setDeliveryMethods([]);
      })
      .finally(() => {
        if (!cancelled) setDeliveryMethodsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [zoneCode, countryCode, authed]);

  const amounts = checkout
    ? subscriptionPayToday(checkout)
    : plan
      ? subscriptionPayToday({
          currencyCode: plan.currencyCode,
          amount: plan.amount,
          shippingAmount: plan.shippingAmount ?? "0.00",
          monthlyTotal: plan.monthlyTotal ?? plan.amount,
        })
      : null;
  const publishableKey = subscriptionCheckoutTestKey(checkout?.publishableKey);
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  async function refreshPayment(id: string) {
    if (opening.current) return;
    opening.current = true;
    const postKey = `sa-sub-checkout-post:${id}`;
    try {
      let view = await readSubscriptionCheckout(id, zoneCode);
      if (
        shouldBeginSubscriptionCheckout({
          alreadyPosted: posted.current || sessionStorage.getItem(postKey) === "1",
          view,
        })
      ) {
        const body = beginCheckoutBody({
          zoneCode,
          consentTextVersion: activeConsent?.version ?? "",
          recurringUseAccepted: true,
          deliveryMethodCode: selectedMethod?.methodCode ?? "",
        });
        if (!body) return;
        posted.current = true;
        sessionStorage.setItem(postKey, "1");
        try {
          view = await beginSubscriptionCheckout(id, body);
        } catch (err) {
          posted.current = false;
          sessionStorage.removeItem(postKey);
          throw err;
        }
      }
      setCheckout(view);
      if (subscriptionCheckoutSucceeded(view)) await savedAgreement.refetch();
    } finally {
      opening.current = false;
    }
  }

  async function registerAndPay() {
    if (!plan || !activeConsent || busy) return;
    if (!authed) {
      router.push(`/login?returnTo=${encodeURIComponent(localizeHref(subscriptionCheckoutPath(planCode), pathname))}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let id = agreementId;
      if (!id) {
        let addressId = selectedAddressId;
        if (!addressId) {
          if (!shipping.address1 || !shipping.fullName) {
            setError("Choose a delivery address.");
            return;
          }
          const [firstName, ...rest] = shipping.fullName.trim().split(/\s+/);
          const createdAddress = await createCustomerAddress({
            type: "SHIPPING",
            firstName,
            lastName: rest.join(" ") || firstName,
            address1: shipping.address1,
            address2: shipping.address2 || null,
            city: shipping.city,
            province: shipping.emirate,
            postalCode: shipping.postalCode,
            countryCode,
            phone: shipping.phone,
          });
          addressId = createdAddress.id;
        }
        const draft = draftFor(planCode);
        const variantIds = draft.mode === "SURPRISE" ? [] : draft.selected;
        const body = buildRegisterBody({
          zoneCode,
          planCode,
          mode: draft.mode,
          audience: draft.audience,
          variantIds,
          customerAddressId: addressId,
          consentTextVersion: activeConsent.version,
          allowedVariantIds: variantIds,
        });
        const created = await registerSubscription(body, registrationIdempotencyKey(registrationFingerprint(body), sessionStorage));
        id = created.id;
        sessionStorage.setItem(`sa-sub-agreement:${planCode}`, id);
        setCreatedAgreementId(id);
      }
      await refreshPayment(id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Checkout could not be started.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!agreementId || !zoneCode || !authed || !activeConsent) return;
    void refreshPayment(agreementId).catch((err: unknown) => {
      setError(err instanceof ApiClientError ? err.message : "Checkout could not be loaded.");
    });
    // Resume an existing agreement once. Polling and Stripe confirmation read again themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId, zoneCode, authed, activeConsent?.version]);

  function addressFields(address: StorefrontCustomerAddressView): AddressFields {
    return {
      fullName: address.fullName || [address.firstName, address.lastName].filter(Boolean).join(" "),
      phone: address.phoneE164 || "",
      address1: address.address1,
      address2: address.address2 || "",
      city: address.city || "",
      emirate: matchCountryRegion(countryCode, address.province, address.city) || address.province || "",
      postalCode: address.postalCode || "",
    };
  }

  function applyPlace(parsed: ParsedStreetAddress) {
    const country = parsed.countryCode || countryCode;
    setShipping((prev) => ({
      ...prev,
      address1: parsed.address1 || prev.address1,
      address2: parsed.address2 || prev.address2,
      city: parsed.city || prev.city,
      emirate: matchCountryRegion(country, parsed.province, parsed.city) || parsed.province || prev.emirate,
      postalCode: parsed.postalCode || prev.postalCode,
    }));
  }

  const savedRows = addresses.data ?? [];
  const lockedAddress = savedRows.find((address) => address.id === addressLock.addressId);
  const profileEmail = user?.email.includes("@") ? user.email : "";
  if (lockedAddress && filledLock !== lockedAddress.id) {
    setFilledLock(lockedAddress.id);
    setShipping(addressFields(lockedAddress));
  }
  if (profileEmail && !filledEmail) {
    setFilledEmail(true);
    setEmail((prev) => prev || profileEmail);
  }

  async function afterStripe() {
    if (!agreementId) return;
    let view = await readSubscriptionCheckout(agreementId, zoneCode);
    for (let attempt = 0; attempt < 3 && (view.paymentState === "PROCESSING" || view.paymentState === "REQUIRES_CUSTOMER_ACTION"); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      view = await readSubscriptionCheckout(agreementId, zoneCode);
    }
    setCheckout(view);
    if (subscriptionCheckoutSucceeded(view)) await savedAgreement.refetch();
  }

  const payTodayNumber = Number(checkout?.monthlyTotal ?? plan?.monthlyTotal ?? plan?.amount ?? "");
  const summaryTotal = Number.isFinite(payTodayNumber) ? formatMoney(payTodayNumber, checkout?.currencyCode || plan?.currencyCode || "AED") : "";

  return (
    <div>
      <section className={collectionHeadFlush} aria-labelledby="checkout-heading">
        <div className={pageContainer}>
          <nav className={crumbs} aria-label="Breadcrumb">
            <ol className={checkoutCrumbsList} role="list">
              <li><LocaleLink href="/">Home</LocaleLink></li>
              <li><LocaleLink href={`/subscriptions/${encodeURIComponent(planCode)}`}>Scent Club</LocaleLink></li>
              <li aria-current="page">Checkout</li>
            </ol>
          </nav>
          <header className={checkoutHead}>
            <h1 className={pageTitle} id="checkout-heading">Checkout</h1>
            <ol className={checkoutSteps}>
              <li><LocaleLink href={`/subscriptions/${encodeURIComponent(planCode)}`}>Scent Club</LocaleLink></li>
              <li aria-hidden="true">·</li>
              <li className={checkoutStepCurrent}>Details &amp; payment</li>
            </ol>
          </header>
          {checkout && subscriptionCheckoutSucceeded(checkout) ? (
            <div className="flex flex-col gap-6">
              <SubscriptionCheckoutSuccess
                planName={plan?.name ?? planCode}
                currencyCode={checkout.currencyCode}
                monthlyTotal={checkout.monthlyTotal}
                nextBillingAt={savedAgreement.data?.status === "ACTIVE" ? savedAgreement.data.nextBillingAt : null}
                subscriptionId={checkout.subscriptionId}
                orderState={checkout.orderState}
                orderNumber={checkout.orderNumber}
                orderId={checkout.orderId}
                orderStatus={checkout.orderStatus}
                fulfillmentStatus={checkout.fulfillmentStatus}
              />
              {savedAgreement.data ? <SubscriptionMonthlyTracker detail={savedAgreement.data} /> : null}
            </div>
          ) : (
          <div className={checkoutLayout}>
            <button
              type="button"
              className={checkoutSummaryToggle}
              aria-expanded={summaryOpen}
              aria-controls="checkout-summary"
              onClick={() => setSummaryOpen((open) => !open)}
            >
              <span>Order summary</span>
              <span className={checkoutSummaryToggleTotal} dir="ltr">
                {summaryTotal}
                <i className={checkoutSummaryChevron} aria-hidden="true" />
              </span>
            </button>
            <GooglePlacesProvider>
              <form
                className={checkoutForm}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!event.currentTarget.reportValidity()) return;
                  void registerAndPay();
                }}
              >
                <CheckoutDelivery
                  email={email}
                  onEmail={setEmail}
                  shipping={shipping}
                  bind={(field) => ({
                    value: shipping[field] ?? "",
                    onChange: (event) => {
                      setSelectedAddressId("");
                      setShipping((prev) => ({ ...prev, [field]: event.target.value }));
                    },
                  })}
                  onPhone={(phone) => { setSelectedAddressId(""); setShipping((prev) => ({ ...prev, phone })); }}
                  onAddress1={(address1) => { setSelectedAddressId(""); setShipping((prev) => ({ ...prev, address1 })); }}
                  onPlace={applyPlace}
                  countryCode={countryCode}
                  regionSet={regionSet}
                  beforeFields={savedRows.length > 0 && !addressLock.locked ? (
                    <label className={fldFull}>
                      <span>Saved address</span>
                      <div className={fldSelect}>
                        <select
                          aria-label="Delivery address"
                          value={selectedAddressId}
                          onChange={(event) => {
                            const id = event.target.value;
                            setSelectedAddressId(id);
                            const address = savedRows.find((item) => item.id === id);
                            setShipping(address ? addressFields(address) : EMPTY_ADDRESS);
                          }}
                        >
                          <option value="">Add a new address</option>
                          {savedRows.map((address) => (
                            <option key={address.id} value={address.id}>
                              {[address.address1, address.city].filter(Boolean).join(", ")}
                            </option>
                          ))}
                        </select>
                        <b aria-hidden="true">▾</b>
                      </div>
                    </label>
                  ) : null}
                />
                <CheckoutShippingMethod
                  methods={subscriptionDeliveryChoices(deliveryMethods, plan?.shippingAmount ?? checkout?.shippingAmount)}
                  selectedId={selectedDeliveryId}
                  status={deliveryMethodsLoaded ? "ready" : "loading"}
                  submitting={busy}
                  currency={checkout?.currencyCode || plan?.currencyCode || "AED"}
                  onSelect={setSelectedDeliveryId}
                />
                <section className={cbox}>
                  <header className={cboxHead}><h2>Payment method</h2></header>
                  <div className={payOptions} role="radiogroup" aria-label="Payment method">
                    <label className={`${payOpt} ${payOptActive}`}>
                      <input type="radio" name="subscriptionPay" checked onChange={() => undefined} />
                      <span>
                        <span className={payOptTitle}>Card</span>
                        <span className={payOptNote}>Visa, Mastercard, American Express</span>
                      </span>
                    </label>
                  </div>
                  {checkout?.clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
                      <PayForm onConfirmed={afterStripe} />
                    </Elements>
                  ) : null}
                  {activeConsent ? (
                    <label className={fldCheck}>
                      <input type="checkbox" checked={accepted || Boolean(agreementId)} disabled={Boolean(agreementId)} onChange={(event) => setAccepted(event.target.checked)} />
                      <span className="whitespace-pre-line">{activeConsent.text}</span>
                    </label>
                  ) : null}
                </section>
                {error ? <p className={checkoutError} role="alert">{error}</p> : null}
                {checkout ? <p role="status">{subscriptionCheckoutResultCopy(checkout)}</p> : null}
                {!checkout?.clientSecret ? (
                  <button type="submit" className={checkoutCta} disabled={busy || !selectedMethod || (!agreementId && !accepted)}>
                    <span>{busy ? "Starting payment…" : "Continue to payment"}</span>
                    <b aria-hidden="true">↗</b>
                  </button>
                ) : null}
                <p className={checkoutLegal}>The same monthly total repeats until you cancel. Payment is encrypted.</p>
              </form>
            </GooglePlacesProvider>
            <aside className={`${checkoutSummary} ${summaryOpen ? checkoutSummaryOpen : ""}`} id="checkout-summary" aria-label="Order summary">
              <h2>Your order</h2>
              <div className={checkoutLines}>
                <article className={coline}>
                  <div className={colineMedia}><b>1</b></div>
                  <div className={colineBody}>
                    <div className={colineTop}>
                      <h3 className={colineName}>{plan?.name ?? "Scent Club"}</h3>
                      <p className={colinePrice} dir="ltr">{amounts?.subscription ?? ""}</p>
                    </div>
                    <p className={colineMeta}>Monthly subscription</p>
                  </div>
                </article>
              </div>
              <dl className={checkoutTotals}>
                <div><dt>Subscription</dt><dd>{amounts?.subscription ?? ""}</dd></div>
                <div><dt>Shipping</dt><dd>{amounts?.shipping ?? ""}</dd></div>
                <div className={checkoutTotalsLine}><dt>Pay today</dt><dd>{amounts?.payToday ?? ""}</dd></div>
              </dl>
              <p className={checkoutBadges}>SSL Encrypted · Monthly total stays fixed</p>
            </aside>
          </div>
          )}
        </div>
      </section>
    </div>
  );
}
