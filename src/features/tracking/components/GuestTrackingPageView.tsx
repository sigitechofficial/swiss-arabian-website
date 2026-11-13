"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import {
  CheckoutSpinnerState,
  CheckoutStateShell,
} from "@/features/checkout/components/CheckoutStateShell";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { formatOrderDate, orderStatusDisplay, trackingUnitCount } from "@/features/orders/utils/orderStatus";
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
import { GuestAfterSalesSection } from "@/features/afterSales";
import { guestAfterSalesLines } from "@/features/afterSales/utils/lines";
import { useGuestTracking } from "../hooks/useOrderTrackingLookup";
import { OrderTrackingPanel } from "./OrderTrackingPanel";

/**
 * Public order tracking. Proof is the customer's own JWT when signed in, or the
 * one-time `orderAccessToken` issued at order creation — never the order number.
 */
export function GuestTrackingPageView({ orderNumber }: { orderNumber: string }) {
  const {
    pathname,
    isAuthenticated,
    loading,
    summary,
    timeline,
    viaGuestToken,
    token,
    ownOrder,
    notInAccount,
    tokenRejected,
    tokenInput,
    setTokenInput,
    formError: formErrorKind,
    lookup,
  } = useGuestTracking(orderNumber);
  const formError =
    formErrorKind === "empty"
      ? "Enter the tracking token from your confirmation email."
      : formErrorKind === "isOrderNumber"
        ? "That’s your order number — paste the tracking token from your confirmation email instead."
        : null;

  if (loading) {
    return (
      <CheckoutStateShell current="Track order">
        <CheckoutSpinnerState title="Looking up your order…" />
      </CheckoutStateShell>
    );
  }

  if (summary) {
    const { label, tone } = orderStatusDisplay(summary.status);
    const units = trackingUnitCount(summary);
    return (
      <CheckoutStateShell current="Track order">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-16">
          <header className="text-center">
            <p className={checkoutEyebrow}>Order tracking</p>
            <h1 className={pageTitle}>{summary.orderNumber}</h1>
            <p className={checkoutNote}>
              Placed on {formatOrderDate(summary.createdAt, { long: true })} ·{" "}
              {units} {units === 1 ? "item" : "items"} ·{" "}
              {formatMoney(Number(summary.total), summary.currency)}
            </p>
            <div className="mt-3 flex justify-center">
              <AccountStatusPill label={label} tone={tone} />
            </div>
          </header>

          <OrderTrackingPanel summary={summary} timeline={timeline} />

          {viaGuestToken && token ? (
            <GuestAfterSalesSection
              orderNumber={summary.orderNumber}
              orderAccessToken={token}
              status={summary.status}
              fulfillmentStatus={summary.fulfillmentStatus}
              lines={guestAfterSalesLines({ shipments: summary.shipments })}
            />
          ) : null}

          <div className={`${checkoutDoneActions} pt-4`}>
            {ownOrder ? (
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
