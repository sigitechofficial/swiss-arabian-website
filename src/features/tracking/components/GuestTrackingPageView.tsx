"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
  const t = useShopCopy();
  const locale = useShopLocale();
  const formError =
    formErrorKind === "empty"
      ? t("track.errToken")
      : formErrorKind === "isOrderNumber"
        ? t("track.errIsOrderNumber")
        : null;

  if (loading) {
    return (
      <CheckoutStateShell current={t("track.trackOrder")}>
        <CheckoutSpinnerState title={t("track.lookingUp")} />
      </CheckoutStateShell>
    );
  }

  if (summary) {
    const { label, tone } = orderStatusDisplay(summary.status, t);
    const units = trackingUnitCount(summary);
    return (
      <CheckoutStateShell current={t("track.trackOrder")}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-16">
          <header className="text-center">
            <p className={checkoutEyebrow}>{t("track.eyebrow")}</p>
            <h1 className={pageTitle}>{summary.orderNumber}</h1>
            <p className={checkoutNote}>
              {t("orders.placedOn", { date: formatOrderDate(summary.createdAt, { long: true, locale }) })} ·{" "}
              {t("account.itemCount", { count: units })} ·{" "}
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
                <span>{t("track.viewFullOrder")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            ) : (
              <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/products">
                <span>{t("track.continueShopping")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            )}
            <LocaleLink className={checkoutLink} href="/">
              {t("track.returnHome")}
            </LocaleLink>
          </div>
        </div>
      </CheckoutStateShell>
    );
  }

  return (
    <CheckoutStateShell current={t("track.trackOrder")}>
      <div className="mx-auto w-full max-w-md pb-16">
        <header className="text-center">
          <p className={checkoutEyebrow}>{t("track.eyebrow")}</p>
          <h1 className={pageTitle}>{t("track.title")}</h1>
          <p className={checkoutNote}>
            {t("track.enterTokenFor")}{" "}
            <span className="font-mono text-sa-primary">{orderNumber}</span>
            {t("orders.guestEnd")}
          </p>
        </header>

        {notInAccount && !token ? (
          <p className={`${checkoutNote} mb-4 text-center`}>
            {t("track.notInAccount")}
          </p>
        ) : null}

        <form className={cbox} onSubmit={lookup} noValidate>
          <div className={cboxBody}>
            {tokenRejected || formError ? (
              <p className={checkoutError} role="alert">
                {formError ?? t("track.tokenRejected")}
              </p>
            ) : null}
            <label className={fldFull}>
              <span>{t("track.token")}</span>
              <input
                type="text"
                name="token"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("track.tokenPlaceholder")}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </label>
            <button type="submit" className={checkoutCta}>
              <span>{t("track.trackOrder")}</span>
              <b aria-hidden="true">↗</b>
            </button>
          </div>
        </form>

        <p className={`${checkoutLegal} mt-4`}>
          {isAuthenticated ? (
            <>
              {t("track.signedInAll")} <LocaleLink href="/account/orders">{t("account.tab.orders")}</LocaleLink>
              {t("orders.guestEnd")}
            </>
          ) : (
            <>
              {t("track.haveAccount")} <LocaleLink href={`/login?returnTo=${encodeURIComponent(pathname)}`}>{t("track.signIn")}</LocaleLink>{" "}
              {t("track.toSeeOrders")}
            </>
          )}
        </p>
      </div>
    </CheckoutStateShell>
  );
}
