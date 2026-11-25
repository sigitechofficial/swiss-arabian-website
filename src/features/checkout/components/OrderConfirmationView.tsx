"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { intlLocale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format/money";
import { hasOrderLoyaltySection, OrderRewardNote } from "@/features/loyalty/components/OrderRewardNote";
import { useOrderReward } from "@/features/loyalty/hooks/useOrderReward";
import { collectionTitle, ocEm, ocEyebrow, ocTitle, stateEyebrow } from "@/styles/shopChrome";
import {
  checkoutCta,
  checkoutCtaGhost,
  checkoutCtaInline,
  checkoutEmpty,
  checkoutLink,
  checkoutNote,
  checkoutTotals,
  checkoutTotalsLine,
  ocActions,
  ocAddress,
  ocAddressName,
  ocAddressSame,
  ocBadge,
  ocBadgeFailed,
  ocBadgeMark,
  ocBadgePending,
  ocBadgeRing,
  ocBadgeSuccess,
  ocBody,
  ocCard,
  ocCardCount,
  ocCopy,
  ocHero,
  ocHeroIntro,
  ocLine,
  ocLineBody,
  ocLineDiscount,
  ocLineMedia,
  ocLineName,
  ocLinePrice,
  ocLineSub,
  ocLines,
  ocMeta,
  ocMetaNumber,
  ocMethods,
  ocStack,
  ocStep,
  ocStepDot,
  ocStepHint,
  ocStepLabel,
  ocSteps,
} from "@/styles/checkoutChrome";
import { HistoricalGiftNote } from "@/features/orders/components/HistoricalGiftNote";
import { HistoricalLineDiscount } from "@/features/orders/components/HistoricalLineDiscount";
import { ORDER_PROGRESS_STEPS, ORDER_PROGRESS_STEP_KEYS, formatOrderDate } from "@/features/orders/utils/orderStatus";
import type { OrderAddressSummary } from "../types/checkout";
import { useOrderConfirmation, type OrderPaymentState } from "../hooks/useOrderConfirmation";
import { orderDeliveryLabel, orderPaymentLabel } from "../utils/methodLabels";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { EM_SLOT, EmphasisCopy } from "./EmphasisCopy";
import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";

type PaymentState = OrderPaymentState;

const STEP_HINTS: Record<(typeof ORDER_PROGRESS_STEPS)[number], MessageKey> = {
  Placed: "checkout.confirmation.step.placed",
  Confirmed: "checkout.confirmation.step.confirmed",
  Preparing: "checkout.confirmation.step.preparing",
  Shipped: "checkout.confirmation.step.shipped",
  Delivered: "checkout.confirmation.step.delivered",
};

/** The country's name in the page's language. */
function countryName(code: string | null, locale: string): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function StatusBadge({ state }: { state: PaymentState }) {
  return (
    <span
      className={`${ocBadge} ${state === "success" ? ocBadgeSuccess : state === "failed" ? ocBadgeFailed : ocBadgePending}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 52 52" fill="none">
        <circle className={ocBadgeRing} cx="26" cy="26" r="24" />
        {state === "success" ? (
          <path className={ocBadgeMark} d="M15 27l7.5 7.5L37 19" />
        ) : state === "failed" ? (
          <path className={ocBadgeMark} d="M18 18l16 16M34 18L18 34" />
        ) : (
          <path className={ocBadgeMark} d="M26 14v12l8 5" />
        )}
      </svg>
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const t = useShopCopy();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      className={ocCopy}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => setCopied(true));
      }}
      aria-label={copied ? t("checkout.confirmation.numberCopied") : t("checkout.confirmation.copyNumber")}
    >
      {copied ? t("checkout.confirmation.copied") : t("checkout.confirmation.copy")}
    </button>
  );
}

function AddressBlock({ title, address }: { title: string; address: OrderAddressSummary }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const cityLine = [address.city, countryName(address.countryCode, locale)]
    .filter(Boolean)
    .join(t("checkout.confirmation.listSeparator"));
  return (
    <div className={ocAddress}>
      <h3>{title}</h3>
      <address>
        {address.fullName ? <span className={ocAddressName}>{address.fullName}</span> : null}
        {address.address1 ? <span>{address.address1}</span> : null}
        {cityLine ? <span>{cityLine}</span> : null}
      </address>
    </div>
  );
}

export function OrderConfirmationView({ orderId }: { orderId: string }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  const { orderQuery, polling, state, details, checking, checkAgain } = useOrderConfirmation(orderId);
  // Frozen order snapshot — never the last cart estimate.
  const orderReward = useOrderReward(orderId);

  if (orderQuery.isPending || polling) {
    return (
      <CheckoutStateShell current={t("checkout.confirmation.crumb")}>
        <CheckoutSpinnerState
          eyebrow={polling ? t("checkout.state.payment") : undefined}
          title={polling ? t("checkout.state.confirmingTitle") : t("checkout.confirmation.loading")}
          body={polling ? t("checkout.state.confirmingBody") : undefined}
        />
      </CheckoutStateShell>
    );
  }

  const order = orderQuery.data;
  if (orderQuery.isError || !order) {
    return (
      <CheckoutStateShell current={t("checkout.confirmation.crumb")}>
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>{t("account.orderLabel")}</p>
          <h1 className={collectionTitle}>{t("checkout.confirmation.loadFailed")}</h1>
          <p>{t("checkout.confirmation.loadFailedBody")}</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
            <span>{t("checkout.state.returnHome")}</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  const {
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
    firstName,
    email,
    isGuest,
    retryHref,
    trackHref,
    itemCount,
    currentStep,
    showProgress,
    paidByOtherTenders,
  } = details!;
  const currency = order.currency;
  const totals = order.totals;
  const shippingTotal = Number(totals.shipping);

  return (
    <CheckoutStateShell current={t("checkout.confirmation.crumb")}>
      <section className={ocHero} aria-labelledby="order-heading">
        <StatusBadge state={state} />
        <p className={ocEyebrow}>
          {state === "success"
            ? t("checkout.confirmation.confirmed")
            : state === "failed"
              ? t("checkout.state.unsuccessful")
              : t("checkout.confirmation.processing")}
        </p>
        <h1 className={ocTitle} id="order-heading">
          {state === "failed" ? (
            <EmphasisCopy text={t("checkout.state.failedTitle", EM_SLOT)} em={t("checkout.state.failedEm")} className={ocEm} />
          ) : firstName ? (
            <EmphasisCopy text={t("checkout.confirmation.thanksName", EM_SLOT)} em={firstName} className={ocEm} />
          ) : (
            <EmphasisCopy text={t("checkout.confirmation.thanks", EM_SLOT)} em={t("checkout.confirmation.thanksEm")} className={ocEm} />
          )}
        </h1>
        <p className={ocHeroIntro}>
          {state === "success" ? (
            <>
              {t("checkout.confirmation.preparing")}{" "}
              {email ? (
                <TextWithLinks
                  text={t("checkout.confirmation.emailSent", linkSlots(["email"]))}
                  links={{ email: <strong>{email}</strong> }}
                />
              ) : (
                t("checkout.confirmation.inboxSent")
              )}
            </>
          ) : state === "failed" ? (
            t("checkout.confirmation.failedIntro")
          ) : (
            t("checkout.confirmation.processingIntro")
          )}
        </p>

        <dl className={ocMeta}>
          {order.orderNumber ? (
            <div>
              <dt>{t("checkout.confirmation.number")}</dt>
              <dd className={ocMetaNumber}>
                <span dir="ltr">{order.orderNumber}</span>
                <CopyButton value={order.orderNumber} />
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{t("checkout.confirmation.date")}</dt>
            <dd>{formatOrderDate(order.createdAt, { timeZone, locale })}</dd>
          </div>
          <div>
            <dt>{t("orders.total")}</dt>
            <dd dir="ltr">{formatMoney(Number(totals.total), currency)}</dd>
          </div>
          <div>
            <dt>{t("orders.payment")}</dt>
            <dd>{orderPaymentLabel(order.selectedPaymentMethod, t, locale)}</dd>
          </div>
        </dl>

        <div className={ocActions}>
          {state === "success" ? (
            <>
              <LocaleLink className={checkoutCta} href="/products">
                <span>{t("track.continueShopping")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
              {trackHref ? (
                <LocaleLink className={checkoutCtaGhost} href={trackHref}>
                  <span>{t("track.trackOrder")}</span>
                </LocaleLink>
              ) : null}
            </>
          ) : state === "failed" ? (
            <>
              <LocaleLink className={checkoutCta} href={retryHref}>
                <span>{t("checkout.state.retryPayment")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
              <LocaleLink className={checkoutCtaGhost} href="/products">
                <span>{t("track.continueShopping")}</span>
              </LocaleLink>
            </>
          ) : (
            <>
              <button
                type="button"
                className={checkoutCta}
                disabled={checking}
                onClick={checkAgain}
              >
                <span>{checking ? t("checkout.confirmation.checking") : t("checkout.confirmation.checkAgain")}</span>
                <b aria-hidden="true">↗</b>
              </button>
              <LocaleLink className={checkoutCtaGhost} href={retryHref}>
                <span>{t("checkout.confirmation.payNow")}</span>
              </LocaleLink>
            </>
          )}
        </div>
        {!isGuest ? (
          <LocaleLink className={`${checkoutLink} mt-4`} href="/account/orders">
            {t("checkout.confirmation.allOrders")}
          </LocaleLink>
        ) : order.orderNumber ? (
          <p className={`${checkoutNote} mt-4`}>{t("checkout.confirmation.keepNumber")}</p>
        ) : null}
      </section>

      <div className={ocBody}>
        <div className={ocStack}>
          {showProgress ? (
            <section className={ocCard} aria-labelledby="order-progress">
              <h2 id="order-progress">{t("checkout.confirmation.next")}</h2>
              <ol className={ocSteps}>
                {ORDER_PROGRESS_STEPS.map((step, index) => {
                  const label = ORDER_PROGRESS_STEP_KEYS[index];
                  const status = index < currentStep ? "done" : index === currentStep ? "current" : "todo";
                  return (
                    <li
                      key={step}
                      className={ocStep}
                      data-status={status}
                      aria-current={status === "current" ? "step" : undefined}
                    >
                      <span className={ocStepDot} aria-hidden="true" />
                      <span className={ocStepLabel}>{label ? t(label) : step}</span>
                      <span className={ocStepHint}>{t(STEP_HINTS[step])}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}

          <section className={ocCard} aria-labelledby="order-items">
            <h2 id="order-items">
              {t("checkout.confirmation.items")} <span className={ocCardCount}>({itemCount})</span>
            </h2>
            <ul className={ocLines} role="list">
              {order.lines.map((line) => {
                const name = line.productName ?? line.sku;
                const qty = Number.parseInt(line.quantity, 10) || 1;
                const variant =
                  line.variantName && line.variantName.trim().toLowerCase() !== name.trim().toLowerCase()
                    ? line.variantName
                    : null;
                const thumb = line.imageUrl?.startsWith("http") ? line.imageUrl : null;
                return (
                  <li className={ocLine} key={line.orderLineId}>
                    <span className={ocLineMedia}>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span aria-hidden="true">{name.charAt(0)}</span>
                      )}
                    </span>
                    <span className={ocLineBody}>
                      <span className={ocLineName}>{name}</span>
                      <span className={ocLineSub}>
                        {[line.isGift ? t("checkout.confirmation.freeGift") : null, variant, t("checkout.confirmation.qty", { qty })]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <HistoricalLineDiscount
                        snapshot={line.promotionSnapshot}
                        currency={line.currencyCode || currency}
                        className={ocLineDiscount}
                      />
                    </span>
                    <span className={ocLinePrice} dir="ltr">
                      {line.isGift ? t("orders.free") : formatMoney(Number(line.lineTotal), line.currencyCode || currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className={ocStack}>
          <section className={ocCard} aria-labelledby="order-summary">
            <h2 id="order-summary">{t("orders.summary")}</h2>
            <dl className={checkoutTotals}>
              <div>
                <dt>{t("orders.subtotal")}</dt>
                <dd dir="ltr">{formatMoney(Number(totals.subtotal), currency)}</dd>
              </div>
              {Number(totals.discount) > 0 ? (
                <div>
                  <dt>{t("orders.discount")}</dt>
                  <dd dir="ltr">−{formatMoney(Number(totals.discount), currency)}</dd>
                </div>
              ) : null}
              <div>
                <dt>{t("orders.shipping")}</dt>
                <dd dir="ltr">{shippingTotal > 0 ? formatMoney(shippingTotal, currency) : t("orders.free")}</dd>
              </div>
              {Number(totals.tax) > 0 ? (
                <div>
                  <dt>{t("orders.tax")}</dt>
                  <dd dir="ltr">{formatMoney(Number(totals.tax), currency)}</dd>
                </div>
              ) : null}
              <HistoricalGiftNote snapshot={order.promotionSnapshot} className={ocLineDiscount} />
              <div className={checkoutTotalsLine}>
                <dt>{t("orders.total")}</dt>
                <dd dir="ltr">{formatMoney(Number(totals.total), currency)}</dd>
              </div>
              {/* Gift card and reward points are tenders, not discounts: the
                  total stays the same, but the shopper must see how it was
                  paid. Without these rows a AED 216 order paid AED 200 by gift
                  card read as AED 216 charged to the payment method. */}
              {Number(totals.giftCardApplied ?? 0) > 0 ? (
                <div>
                  <dt>{t("checkout.confirmation.paidGiftCard")}</dt>
                  <dd dir="ltr">−{formatMoney(Number(totals.giftCardApplied), currency)}</dd>
                </div>
              ) : null}
              {Number(totals.loyaltyApplied ?? 0) > 0 ? (
                <div>
                  <dt>{t("checkout.confirmation.paidPoints")}</dt>
                  <dd dir="ltr">−{formatMoney(Number(totals.loyaltyApplied), currency)}</dd>
                </div>
              ) : null}
              {paidByOtherTenders ? (
                <div className={checkoutTotalsLine}>
                  <dt>{orderPaymentLabel(order.selectedPaymentMethod, t, locale)}</dt>
                  <dd dir="ltr">{formatMoney(Number(totals.amountPayable ?? 0), currency)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {hasOrderLoyaltySection(orderReward) ? (
            <div className={ocCard}>
              <OrderRewardNote reward={orderReward} />
            </div>
          ) : null}

          <section className={ocCard} aria-labelledby="order-delivery">
            <h2 id="order-delivery">{t("checkout.confirmation.deliveryPayment")}</h2>
            {shippingAddress ? <AddressBlock title={t("shipTo")} address={shippingAddress} /> : null}
            {billingAddress ? (
              billingSameAsShipping ? (
                <div className={ocAddress}>
                  <h3>{t("checkout.confirmation.billTo")}</h3>
                  <p className={ocAddressSame}>{t("checkout.confirmation.sameAsShipping")}</p>
                </div>
              ) : (
                <AddressBlock title={t("checkout.confirmation.billTo")} address={billingAddress} />
              )
            ) : null}
            <dl className={ocMethods}>
              <div>
                <dt>{t("orders.delivery")}</dt>
                <dd>{orderDeliveryLabel(order.selectedDeliveryMethod, t, locale)}</dd>
              </div>
              <div>
                <dt>{t("orders.payment")}</dt>
                <dd>{orderPaymentLabel(order.selectedPaymentMethod, t, locale)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </CheckoutStateShell>
  );
}
