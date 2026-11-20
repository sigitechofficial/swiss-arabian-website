"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import {
  checkoutCta,
  checkoutCtaGhost,
  checkoutLink,
  ocActions,
  ocBadge,
  ocBadgeMark,
  ocBadgeRing,
  ocBadgeSuccess,
  ocHero,
  ocHeroIntro,
  ocMeta,
  ocMetaNumber,
} from "@/styles/checkoutChrome";
import { ocEm, ocEyebrow, ocTitle } from "@/styles/shopChrome";
import { subscriptionCheckoutOrderPresentation } from "../utils/subscriptionMonthlyTracker";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";

type Props = {
  planName: string;
  currencyCode: string;
  monthlyTotal: string;
  nextBillingAt: string | null;
  subscriptionId: string;
  orderState?: "CONFIRMED" | "PENDING" | "NONE" | null;
  orderNumber?: string | null;
  orderId?: string | null;
  orderStatus?: string | null;
  fulfillmentStatus?: string | null;
  shipmentStatus?: string | null;
};

export function SubscriptionCheckoutSuccess({
  planName,
  currencyCode,
  monthlyTotal,
  nextBillingAt,
  subscriptionId,
  orderState,
  orderNumber,
  orderId,
  orderStatus,
  fulfillmentStatus,
  shipmentStatus,
}: Props) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  const order = subscriptionCheckoutOrderPresentation(
    {
      orderState,
      orderId,
      orderNumber,
      orderStatus,
      fulfillmentStatus,
      shipmentStatus,
    },
    t,
  );
  const billingLabel = nextBillingAt
    ? formatOrderDate(nextBillingAt, { long: true, timeZone, locale })
    : t("subs.success.notScheduled");

  return (
    <section className={ocHero} aria-labelledby="subscription-success-heading">
      <span className={`${ocBadge} ${ocBadgeSuccess}`} aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none">
          <circle className={ocBadgeRing} cx="26" cy="26" r="24" />
          <path className={ocBadgeMark} d="M15 27l7.5 7.5L37 19" />
        </svg>
      </span>
      <p className={ocEyebrow}>{t("subs.success.eyebrow")}</p>
      <h1 className={ocTitle} id="subscription-success-heading">
        <TextWithLinks
          text={t("subs.success.title", linkSlots(["activated"]))}
          links={{ activated: <em className={ocEm}>{t("subs.success.titleEm")}</em> }}
        />
      </h1>
      <p className={ocHeroIntro}>
        {t("subs.success.intro")}
      </p>
      <dl className={ocMeta}>
        <div>
          <dt>{t("subs.success.plan")}</dt>
          <dd>{planName}</dd>
        </div>
        <div>
          <dt>{t("subs.detail.monthlyTotal")}</dt>
          <dd dir="ltr">{currencyCode} {monthlyTotal}</dd>
        </div>
        <div>
          <dt>{t("subs.success.firstPayment")}</dt>
          <dd>{t("subs.text.paid")}</dd>
        </div>
        <div>
          <dt>{t("subs.success.firstOrder")}</dt>
          <dd className={order.trackHref ? ocMetaNumber : undefined}>
            {order.trackHref ? <span dir="ltr">{order.orderLabel}</span> : order.orderLabel}
          </dd>
        </div>
        {order.fulfillmentLabel ? (
          <div>
            <dt>{t("subs.success.orderStatus")}</dt>
            <dd>{order.fulfillmentLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t("subs.success.nextBilling")}</dt>
          <dd>{billingLabel}</dd>
        </div>
      </dl>
      <div className={ocActions}>
        <LocaleLink className={checkoutCta} href={`/account/subscription/${encodeURIComponent(subscriptionId)}`}>
          <span>{t("subs.success.view")}</span>
          <b aria-hidden="true">↗</b>
        </LocaleLink>
        {order.trackHref ? (
          <LocaleLink className={checkoutCtaGhost} href={order.trackHref}>
            <span>{t("subs.success.trackFirst")}</span>
          </LocaleLink>
        ) : null}
      </div>
      <LocaleLink className={`${checkoutLink} mt-4`} href="/account/subscription">
        {t("subs.detail.all")}
      </LocaleLink>
    </section>
  );
}
