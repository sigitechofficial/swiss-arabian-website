"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import {
  CheckoutSpinnerState,
  CheckoutStateShell,
} from "@/features/checkout/components/CheckoutStateShell";
import {
  getStoredGuestOrderAccessToken,
  storeGuestOrderAccessToken,
} from "@/features/checkout/utils/checkoutSession";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { formatOrderDate, orderStatusDisplay } from "@/features/orders/utils/orderStatus";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuthStore } from "@/stores/useAuthStore";
import { checkoutEyebrow, pageTitle } from "@/styles/shopChrome";
import {
  cbox,
  cboxBody,
  checkoutCta,
  checkoutCtaInline,
  checkoutDoneActions,
  checkoutError,
  checkoutLegal,
  checkoutLink,
  checkoutNote,
  fldFull,
} from "@/styles/checkoutChrome";
import { getOrderTracking, getOrderTrackingTimeline } from "../api/orderTracking.service";
import { OrderTrackingPanel } from "./OrderTrackingPanel";

/**
 * Public order tracking. Proof is the customer's own JWT when signed in, or the
 * one-time `orderAccessToken` issued at order creation — never the order number.
 */
export function GuestTrackingPageView({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Email links carry the token as `?token=`. Keep it (scoped to this order)
  // and take it out of the address bar so it isn't shared or logged.
  const rawUrlToken = searchParams.get("token") ?? searchParams.get("orderAccessToken");
  const urlToken = rawUrlToken && rawUrlToken !== orderNumber ? rawUrlToken : null;
  useEffect(() => {
    if (!urlToken) return;
    storeGuestOrderAccessToken(orderNumber, urlToken);
    router.replace(pathname);
  }, [urlToken, orderNumber, pathname, router]);

  const storedToken = hydrated ? getStoredGuestOrderAccessToken(orderNumber) : null;
  const [enteredToken, setEnteredToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const token = enteredToken ?? urlToken ?? storedToken;

  const accountQuery = useQuery({
    queryKey: ["order-tracking", orderNumber, "account"],
    queryFn: () => getOrderTracking(orderNumber),
    enabled: bootstrapped && isAuthenticated,
    retry: false,
  });

  // Guests — or signed-in shoppers tracking an order that isn't theirs.
  const guestEnabled =
    bootstrapped && Boolean(token) && (!isAuthenticated || accountQuery.isError);
  const guestQuery = useQuery({
    queryKey: ["order-tracking", orderNumber, "guest", token],
    queryFn: () => getOrderTracking(orderNumber, token),
    enabled: guestEnabled,
    retry: false,
  });

  // Persist a manually entered token only once it has actually worked.
  useEffect(() => {
    if (guestQuery.data && token) storeGuestOrderAccessToken(orderNumber, token);
  }, [guestQuery.data, token, orderNumber]);

  const summary = accountQuery.data ?? guestQuery.data ?? null;
  const viaGuestToken = !accountQuery.data && Boolean(guestQuery.data);
  const timelineQuery = useQuery({
    queryKey: ["order-tracking-timeline", orderNumber, viaGuestToken ? token : "account"],
    queryFn: () => getOrderTrackingTimeline(orderNumber, viaGuestToken ? token : null),
    enabled: Boolean(summary?.shipments.length),
    retry: false,
  });

  const loading =
    !hydrated ||
    !bootstrapped ||
    (isAuthenticated && accountQuery.isPending) ||
    (guestEnabled && guestQuery.isPending);

  function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = tokenInput.trim();
    if (!value) return setFormError("Enter the tracking token from your confirmation email.");
    if (value.toUpperCase() === orderNumber.toUpperCase()) {
      return setFormError("That’s your order number — paste the tracking token from your confirmation email instead.");
    }
    setFormError(null);
    setEnteredToken(value);
  }

  if (loading) {
    return (
      <CheckoutStateShell current="Track order">
        <CheckoutSpinnerState title="Looking up your order…" />
      </CheckoutStateShell>
    );
  }

  if (summary) {
    const { label, tone } = orderStatusDisplay(summary.status);
    return (
      <CheckoutStateShell current="Track order">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-16">
          <header className="text-center">
            <p className={checkoutEyebrow}>Order tracking</p>
            <h1 className={pageTitle}>{summary.orderNumber}</h1>
            <p className={checkoutNote}>
              Placed on {formatOrderDate(summary.createdAt, { long: true })} ·{" "}
              {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"} ·{" "}
              {formatMoney(Number(summary.total), summary.currency)}
            </p>
            <div className="mt-3 flex justify-center">
              <AccountStatusPill label={label} tone={tone} />
            </div>
          </header>

          <OrderTrackingPanel summary={summary} timeline={timelineQuery.data} />

          <div className={`${checkoutDoneActions} pt-4`}>
            {accountQuery.data && !summary.isGuestOrder ? (
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href={`/account/orders/${encodeURIComponent(summary.orderId)}`}
              >
                <span>View full order</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            ) : (
              <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/products">
                <span>Continue shopping</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            )}
            <LocaleLink className={checkoutLink} href="/">
              Return home
            </LocaleLink>
          </div>
        </div>
      </CheckoutStateShell>
    );
  }

  const notInAccount = isAuthenticated && accountQuery.isError;
  const tokenRejected = guestQuery.isError;

  return (
    <CheckoutStateShell current="Track order">
      <div className="mx-auto w-full max-w-md pb-16">
        <header className="text-center">
          <p className={checkoutEyebrow}>Order tracking</p>
          <h1 className={pageTitle}>Track your order</h1>
          <p className={checkoutNote}>
            Enter the tracking token from your confirmation email for order{" "}
            <span className="font-mono text-sa-primary">{orderNumber}</span>.
          </p>
        </header>

        {notInAccount && !token ? (
          <p className={`${checkoutNote} mb-4 text-center`}>
            This order isn’t in your account. If it was placed as a guest, use its tracking token below.
          </p>
        ) : null}

        <form className={cbox} onSubmit={lookup} noValidate>
          <div className={cboxBody}>
            {tokenRejected || formError ? (
              <p className={checkoutError} role="alert">
                {formError ??
                  "We couldn’t find an order with that number and token. Use the tracking token from your confirmation email — not the order number."}
              </p>
            ) : null}
            <label className={fldFull}>
              <span>Tracking token</span>
              <input
                type="text"
                name="token"
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste your token here"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </label>
            <button type="submit" className={checkoutCta}>
              <span>Track order</span>
              <b aria-hidden="true">↗</b>
            </button>
          </div>
        </form>

        <p className={`${checkoutLegal} mt-4`}>
          {isAuthenticated ? (
            <>
              Signed in? All your orders are in <LocaleLink href="/account/orders">Purchase History</LocaleLink>.
            </>
          ) : (
            <>
              Have an account? <LocaleLink href={`/login?returnTo=${encodeURIComponent(pathname)}`}>Sign in</LocaleLink> to see
              your orders.
            </>
          )}
        </p>
      </div>
    </CheckoutStateShell>
  );
}
