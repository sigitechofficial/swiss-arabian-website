"use client";

import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";

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
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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

function readDraft(raw: string): { mode: "SURPRISE" | "QUEUE"; selected: string[]; audience: "MEN" | "WOMEN" } {
  if (!raw) return { mode: "QUEUE", selected: [], audience: "MEN" };
  try {
    const parsed = JSON.parse(raw) as { mode?: string; selected?: unknown; audience?: string };
    const selected = Array.isArray(parsed.selected)
      ? parsed.selected.filter((id): id is string => typeof id === "string")
      : [];
    return {
      mode: parsed.mode === "SURPRISE" ? "SURPRISE" : "QUEUE",
      selected,
      audience: parsed.audience === "WOMEN" ? "WOMEN" : "MEN",
    };
  } catch {
    return { mode: "QUEUE", selected: [], audience: "MEN" };
  }
}

function draftFor(planCode: string): { mode: "SURPRISE" | "QUEUE"; selected: string[]; audience: "MEN" | "WOMEN" } {
  return readDraft(sessionStorage.getItem(`sa-sub-draft:${planCode}`) ?? "");
}

function PayForm({
  onConfirmed,
}: {
  onConfirmed: () => Promise<void>;
}) {
  const t = useShopCopy();
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
      // Stripe words its own errors in the page language (Elements locale).
      setError(result.error.message ?? t("subs.checkout.paymentNotConfirmed"));
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
        <span>{busy ? t("subs.checkout.processing") : t("subs.checkout.payToday")}</span>
        <b aria-hidden="true">↗</b>
      </button>
    </div>
  );
}

export function SubscriptionCheckoutPageView({ planCode }: { planCode: string }) {
  const t = useShopCopy();
  const router = useRouter();
  const pathname = usePathname();
  const authed = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode || state.selectedMarketId || "");
  const checkoutZoneId = useUiStore((state) => state.catalogContext?.zoneId || "");
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
  const [droppedStoredId, setDroppedStoredId] = useState(false);
  const agreementId = createdAgreementId || (droppedStoredId ? "" : storedAgreementId);
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
  const orderImage = plan?.imageUrl?.trim() || savedAgreement.data?.imageUrl?.trim() || null;
  // The shopper's delivery choice, or the first available method by default.
  const activeDeliveryId = selectedDeliveryId ?? deliveryMethods[0]?.zoneDeliveryMethodId ?? null;
  const selectedMethod = deliveryMethods.find((method) => method.zoneDeliveryMethodId === activeDeliveryId) ?? null;

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
    ? subscriptionPayToday(checkout, t)
    : plan
      ? subscriptionPayToday({
          currencyCode: plan.currencyCode,
          amount: plan.amount,
          shippingAmount: plan.shippingAmount ?? "0.00",
          monthlyTotal: plan.monthlyTotal ?? plan.amount,
        }, t)
      : null;
  const publishableKey = subscriptionCheckoutTestKey(checkout?.publishableKey);
  const stripePromise = useMemo(() => (publishableKey ? getStripe(publishableKey) : null), [publishableKey]);

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

  function missingSubscription(err: unknown): boolean {
    return err instanceof ApiClientError && err.code === "SUBSCRIPTION_NOT_FOUND";
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
      let id = savedAgreement.isError ? "" : agreementId;
      if (id) {
        try {
          await refreshPayment(id);
          return;
        } catch (err) {
          if (!missingSubscription(err)) throw err;
          sessionStorage.removeItem(`sa-sub-agreement:${planCode}`);
          setDroppedStoredId(true);
          setCreatedAgreementId("");
          id = "";
        }
      }
      if (!id) {
        let addressId = selectedAddressId;
        if (!addressId) {
          if (!shipping.address1 || !shipping.fullName) {
            setError(t("subs.checkout.chooseAddress"));
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
            ...(checkoutZoneId ? { zoneId: checkoutZoneId } : {}),
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
      setError(getUserFacingErrorMessage(err, t("subs.checkout.startFailed"), t));
    } finally {
      setBusy(false);
    }
  }

  // A stored agreement the server no longer has pending is dropped once
  // (decided during render; the flag keeps the decision stable afterwards).
  const storedAgreementGone =
    Boolean(storedAgreementId) &&
    !createdAgreementId &&
    (savedAgreement.isFetched || savedAgreement.isError) &&
    (savedAgreement.isError || savedAgreement.data?.status !== "PENDING_ACTIVATION");
  if (storedAgreementGone && !droppedStoredId) {
    setDroppedStoredId(true);
    setError(null);
  }
  useEffect(() => {
    if (droppedStoredId) sessionStorage.removeItem(`sa-sub-agreement:${planCode}`);
  }, [droppedStoredId, planCode]);

  useEffect(() => {
    if (!agreementId || !zoneCode || !authed || !activeConsent || savedAgreement.isError) return;
    if (!createdAgreementId && (!savedAgreement.isFetched || savedAgreement.data?.status !== "PENDING_ACTIVATION")) return;
    void refreshPayment(agreementId).catch((err: unknown) => {
      if (missingSubscription(err)) {
        sessionStorage.removeItem(`sa-sub-agreement:${planCode}`);
        setDroppedStoredId(true);
        setCreatedAgreementId("");
        setError(null);
        return;
      }
      setError(getUserFacingErrorMessage(err, t("subs.checkout.loadFailed"), t));
    });
    // Resume an existing agreement once. Polling and Stripe confirmation read again themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId, zoneCode, authed, activeConsent?.version, createdAgreementId, savedAgreement.isFetched, savedAgreement.data?.status]);

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
          <nav className={crumbs} aria-label={t("subs.checkout.breadcrumb")}>
            <ol className={checkoutCrumbsList} role="list">
              <li><LocaleLink href="/">{t("home")}</LocaleLink></li>
              <li><LocaleLink href={`/subscriptions/${encodeURIComponent(planCode)}`}>{t("subs.checkout.scentClub")}</LocaleLink></li>
              <li aria-current="page">{t("pages.title.checkout")}</li>
            </ol>
          </nav>
          <header className={checkoutHead}>
            <h1 className={pageTitle} id="checkout-heading">{t("pages.title.checkout")}</h1>
            <ol className={checkoutSteps}>
              <li><LocaleLink href={`/subscriptions/${encodeURIComponent(planCode)}`}>{t("subs.checkout.scentClub")}</LocaleLink></li>
              <li aria-hidden="true">·</li>
              <li className={checkoutStepCurrent}>{t("subs.checkout.detailsStep")}</li>
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
              <span>{t("orders.summary")}</span>
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
                      <span>{t("subs.checkout.savedAddress")}</span>
                      <div className={fldSelect}>
                        <select
                          aria-label={t("account.deliveryAddress")}
                          value={selectedAddressId}
                          onChange={(event) => {
                            const id = event.target.value;
                            setSelectedAddressId(id);
                            const address = savedRows.find((item) => item.id === id);
                            setShipping(address ? addressFields(address) : EMPTY_ADDRESS);
                          }}
                        >
                          <option value="">{t("subs.checkout.newAddress")}</option>
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
                  selectedId={activeDeliveryId}
                  status={deliveryMethodsLoaded ? "ready" : "loading"}
                  submitting={busy}
                  currency={checkout?.currencyCode || plan?.currencyCode || "AED"}
                  onSelect={setSelectedDeliveryId}
                />
                <section className={cbox}>
                  <header className={cboxHead}><h2>{t("subs.checkout.paymentMethod")}</h2></header>
                  <div className={payOptions} role="radiogroup" aria-label={t("subs.checkout.paymentMethod")}>
                    <label className={`${payOpt} ${payOptActive}`}>
                      <input type="radio" name="subscriptionPay" checked onChange={() => undefined} />
                      <span>
                        <span className={payOptTitle}>{t("subs.card.card")}</span>
                        <span className={payOptNote}>{t("subs.checkout.cardBrands")}</span>
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
                {checkout ? <p role="status">{subscriptionCheckoutResultCopy(checkout, t)}</p> : null}
                {!checkout?.clientSecret ? (
                  <button type="submit" className={checkoutCta} disabled={busy || !selectedMethod || (!agreementId && !accepted)}>
                    <span>{busy ? t("subs.checkout.starting") : t("subs.checkout.continue")}</span>
                    <b aria-hidden="true">↗</b>
                  </button>
                ) : null}
                <p className={checkoutLegal}>{t("subs.checkout.legal")}</p>
              </form>
            </GooglePlacesProvider>
            <aside className={`${checkoutSummary} ${summaryOpen ? checkoutSummaryOpen : ""}`} id="checkout-summary" aria-label={t("orders.summary")}>
              <h2>{t("subs.checkout.yourOrder")}</h2>
              <div className={checkoutLines}>
                <article className={coline} style={{ gridTemplateColumns: "112px minmax(0, 1fr)", alignItems: "center" }}>
                  <div className={colineMedia} style={{ width: 112, height: 112 }}>
                    {orderImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={orderImage}
                        alt=""
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : null}
                    <b>1</b>
                  </div>
                  <div className={colineBody}>
                    <div className={colineTop}>
                      <h3 className={colineName}>{plan?.name ?? t("subs.checkout.scentClub")}</h3>
                      <p className={colinePrice} dir="ltr">{amounts?.subscription ?? ""}</p>
                    </div>
                    <p className={colineMeta}>{t("subs.checkout.monthly")}</p>
                  </div>
                </article>
              </div>
              <dl className={checkoutTotals}>
                <div><dt>{t("subs.checkout.subscription")}</dt><dd>{amounts?.subscription ?? ""}</dd></div>
                <div><dt>{t("orders.shipping")}</dt><dd>{amounts?.shipping ?? ""}</dd></div>
                <div className={checkoutTotalsLine}><dt>{t("subs.checkout.payToday")}</dt><dd>{amounts?.payToday ?? ""}</dd></div>
              </dl>
              <p className={checkoutBadges}>{t("subs.checkout.badges")}</p>
            </aside>
          </div>
          )}
        </div>
      </section>
    </div>
  );
}
