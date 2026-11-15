"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { CheckoutStateShell } from "@/features/checkout/components/CheckoutStateShell";
import { checkoutEyebrow, pageTitle } from "@/styles/shopChrome";
import {
  cbox,
  cboxBody,
  checkoutCta,
  checkoutError,
  checkoutLegal,
  checkoutNote,
  fldFull,
  fldHint,
} from "@/styles/checkoutChrome";
import { useTrackLookup } from "../hooks/useOrderTrackingLookup";

/** `/track` — find an order by number, with the token from the confirmation email. */
export function TrackLookupView() {
  const { isAuthenticated, orderNumber, setOrderNumber, token, setToken, error: errorKind, submit } = useTrackLookup();
  const t = useShopCopy();
  const error =
    errorKind === "orderNumber"
      ? t("track.errOrderNumber")
      : errorKind === "token"
        ? t("track.errToken")
        : null;

  return (
    <CheckoutStateShell current={t("track.trackOrder")}>
      <div className="mx-auto w-full max-w-md pb-16">
        <header className="text-center">
          <p className={checkoutEyebrow}>{t("track.eyebrow")}</p>
          <h1 className={pageTitle}>{t("track.title")}</h1>
          <p className={checkoutNote}>
            {t("track.lookupIntro")}
          </p>
        </header>

        <form className={cbox} onSubmit={submit} noValidate>
          <div className={cboxBody}>
            {error ? (
              <p className={checkoutError} role="alert">
                {error}
              </p>
            ) : null}
            <label className={fldFull}>
              <span>{t("track.orderNumber")}</span>
              <input
                type="text"
                name="orderNumber"
                autoComplete="off"
                spellCheck={false}
                placeholder="UAE-XXXXXXXX-XXXXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </label>
            <label className={fldFull}>
              <span>
                {t("track.token")}
                {isAuthenticated ? <span className={fldHint}>{t("track.tokenOwnHint")}</span> : null}
              </span>
              <input
                type="text"
                name="token"
                autoComplete="off"
                spellCheck={false}
                placeholder={t("track.tokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
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
              {t("track.allOrdersIn")} <LocaleLink href="/account/orders">{t("account.tab.orders")}</LocaleLink>
              {t("orders.guestEnd")}
            </>
          ) : (
            <>
              {t("track.haveAccount")} <LocaleLink href="/login?returnTo=%2Faccount%2Forders">{t("track.signIn")}</LocaleLink>{" "}
              {t("track.toSeeAllOrders")}
            </>
          )}
        </p>
      </div>
    </CheckoutStateShell>
  );
}
