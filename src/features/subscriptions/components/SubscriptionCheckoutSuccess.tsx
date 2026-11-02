"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
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
  const order = subscriptionCheckoutOrderPresentation({
    orderState,
    orderId,
    orderNumber,
    orderStatus,
    fulfillmentStatus,
    shipmentStatus,
  });
  const billingLabel = nextBillingAt ? formatOrderDate(nextBillingAt, { long: true }) : "Not scheduled on this page";

  return (
    <section className={ocHero} aria-labelledby="subscription-success-heading">
      <span className={`${ocBadge} ${ocBadgeSuccess}`} aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none">
          <circle className={ocBadgeRing} cx="26" cy="26" r="24" />
          <path className={ocBadgeMark} d="M15 27l7.5 7.5L37 19" />
        </svg>
      </span>
      <p className={ocEyebrow}>Payment successful</p>
      <h1 className={ocTitle} id="subscription-success-heading">
        Your subscription is <em className={ocEm}>activated</em>.
      </h1>
      <p className={ocHeroIntro}>
        The first payment is confirmed. Future months stay upcoming until each billing date.
      </p>
      <dl className={ocMeta}>
        <div>
          <dt>Plan</dt>
          <dd>{planName}</dd>
        </div>
        <div>
          <dt>Monthly total</dt>
          <dd dir="ltr">{currencyCode} {monthlyTotal}</dd>
        </div>
        <div>
          <dt>First payment</dt>
          <dd>Paid</dd>
        </div>
        <div>
          <dt>First order</dt>
          <dd className={order.trackHref ? ocMetaNumber : undefined}>
            {order.trackHref ? <span dir="ltr">{order.orderLabel}</span> : order.orderLabel}
          </dd>
        </div>
        {order.fulfillmentLabel ? (
          <div>
            <dt>Order status</dt>
            <dd>{order.fulfillmentLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Next billing date</dt>
          <dd>{billingLabel}</dd>
        </div>
      </dl>
      <div className={ocActions}>
        <LocaleLink className={checkoutCta} href={`/account/subscription/${encodeURIComponent(subscriptionId)}`}>
          <span>View subscription</span>
          <b aria-hidden="true">↗</b>
        </LocaleLink>
        {order.trackHref ? (
          <LocaleLink className={checkoutCtaGhost} href={order.trackHref}>
            <span>Track first order</span>
          </LocaleLink>
        ) : null}
      </div>
      <LocaleLink className={`${checkoutLink} mt-4`} href="/account/subscription">
        All subscriptions
      </LocaleLink>
    </section>
  );
}
