"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@/features/home/utils/formatMoney";
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
import {
  ORDER_PROGRESS_STEPS,
  formatOrderDate,
  orderProgressStep,
} from "@/features/orders/utils/orderStatus";
import {
  insiderPurchasePage,
  toInsiderPurchaseValueFromOrder,
} from "@/lib/insider";
import { getOrder, pollUntilPaymentSettles } from "../api/orders.service";
import type { OrderAddressSummary } from "../types/checkout";
import { orderDeliveryLabel, orderPaymentLabel } from "../utils/methodLabels";
import { trackPromotion } from "@/features/promotions/utils/promotionAnalytics";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";

type PaymentState = "success" | "pending" | "failed";

function paymentState(status?: string | null): PaymentState {
  const s = status?.toUpperCase() ?? "";
  if (s === "PAID" || s === "AUTHORIZED") return "success";
  if (s === "FAILED" || s === "DECLINED" || s === "CANCELLED") return "failed";
  return "pending";
}

const STEP_HINTS: Record<(typeof ORDER_PROGRESS_STEPS)[number], string> = {
  Placed: "We’ve received your order",
  Confirmed: "Payment confirmed",
  Preparing: "Packed with care",
  Shipped: "Tracking sent by email",
  Delivered: "Enjoy your fragrance",
};

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function sameAddress(a?: OrderAddressSummary, b?: OrderAddressSummary): boolean {
  if (!a || !b) return false;
  return (
    a.fullName === b.fullName &&
    a.address1 === b.address1 &&
    a.city === b.city &&
    a.countryCode === b.countryCode
  );
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
      aria-label={copied ? "Order number copied" : "Copy order number"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AddressBlock({ title, address }: { title: string; address: OrderAddressSummary }) {
  const cityLine = [address.city, countryName(address.countryCode)].filter(Boolean).join(", ");
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
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify") === "1";

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    retry: 1,
  });

  // Frozen order snapshot — never the last cart estimate.
  const orderReward = useOrderReward(orderId);

  const loadedOrder = orderQuery.data;
  const method = loadedOrder?.selectedPaymentMethod;
  // Cash on delivery has no gateway step to wait for.
  const payOffline = /\bcod\b|cash/i.test(`${method?.providerCode ?? ""} ${method?.methodCode ?? ""}`);

  // Gateways (Paymob, Stripe 3DS) send the shopper here straight after paying —
  // that proves nothing. While an online payment still reads pending, poll
  // payment-status until the webhook settles it (or we time out).
  const shouldPoll =
    Boolean(loadedOrder) &&
    !payOffline &&
    (verify || paymentState(loadedOrder?.paymentStatus) === "pending");

  const settle = useQuery({
    queryKey: ["order-payment-settle", orderId],
    queryFn: () => pollUntilPaymentSettles(orderId),
    enabled: shouldPoll,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  const polling = shouldPoll && !settle.data && !settle.isError;
  const purchaseSent = useRef(false);

  useEffect(() => {
    const placed = orderQuery.data;
    if (!placed || purchaseSent.current) return;
    const method = placed.selectedPaymentMethod;
    const offline = /\bcod\b|cash/i.test(
      `${method?.providerCode ?? ""} ${method?.methodCode ?? ""}`,
    );
    const raw = paymentState(settle.data?.status ?? placed.paymentStatus);
    const paid = offline && raw === "pending" ? "success" : raw;
    if (paid !== "success") return;
    purchaseSent.current = true;
    trackPromotion("promotion_order_completed", { surface: "order" });
    insiderPurchasePage(
      toInsiderPurchaseValueFromOrder({
        orderId: placed.orderId,
        orderNumber: placed.orderNumber,
        totals: placed.totals,
        lines: placed.lines,
      }),
    );
  }, [orderQuery.data, settle.data?.status]);

  if (orderQuery.isPending || polling) {
    return (
      <CheckoutStateShell current="Order confirmation">
        <CheckoutSpinnerState
          eyebrow={polling ? "Payment" : undefined}
          title={polling ? "Confirming your payment…" : "Loading your order…"}
          body={
            polling ? "This usually takes a few seconds. Please don’t close or refresh this page." : undefined
          }
        />
      </CheckoutStateShell>
    );
  }

  const order = orderQuery.data;
  if (orderQuery.isError || !order) {
    return (
      <CheckoutStateShell current="Order confirmation">
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>Order</p>
          <h1 className={collectionTitle}>We couldn’t load this order.</h1>
          <p>It may belong to another session. Your confirmation email has the details.</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
            <span>Return home</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  const rawState = paymentState(settle.data?.status ?? order.paymentStatus);
  // A cash-on-delivery order is confirmed on placement; payment comes later.
  const state: PaymentState = payOffline && rawState === "pending" ? "success" : rawState;
  const currency = order.currency;
  const shippingAddress = order.addresses?.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses?.find((a) => a.addressType === "BILLING");
  const firstName = (order.customer?.fullName ?? shippingAddress?.fullName ?? "")
    .trim()
    .split(/\s+/)[0];
  const email = order.customer?.email;
  const isGuest = Boolean(order.customer?.isGuest);
  const retryHref = `/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`;
  const trackHref = order.orderNumber
    ? isGuest
      ? `/track/${encodeURIComponent(order.orderNumber)}`
      : `/account/orders/${encodeURIComponent(order.orderId)}#tracking`
    : null;
  const totals = order.totals;
  const shippingTotal = Number(totals.shipping);
  const itemCount = order.lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0);

  // A just-paid order can still read PAYMENT_PENDING for a moment — never show it behind "Confirmed".
  const rawStep = orderProgressStep(order.status);
  const currentStep = state === "success" ? Math.max(rawStep, 1) : rawStep;
  const showProgress = state !== "failed" && currentStep >= 0;

  return (
    <CheckoutStateShell current="Order confirmation">
      <section className={ocHero} aria-labelledby="order-heading">
        <StatusBadge state={state} />
        <p className={ocEyebrow}>
          {state === "success" ? "Order confirmed" : state === "failed" ? "Payment unsuccessful" : "Payment processing"}
        </p>
        <h1 className={ocTitle} id="order-heading">
          {state === "failed" ? (
            <>
              Your payment <em className={ocEm}>didn’t go through</em>.
            </>
          ) : firstName ? (
            <>
              Thank you, <em className={ocEm}>{firstName}</em>.
            </>
          ) : (
            <>
              Thank you for <em className={ocEm}>your order</em>.
            </>
          )}
        </h1>
        <p className={ocHeroIntro}>
          {state === "success" ? (
            <>
              We’ll start preparing your order shortly.
              {email ? (
                <>
                  {" "}
                  A confirmation is on its way to <strong>{email}</strong>.
                </>
              ) : (
                " A confirmation is on its way to your inbox."
              )}
            </>
          ) : state === "failed" ? (
            "Your order is saved, but the payment wasn’t completed. You can try again below."
          ) : (
            "Your payment is still processing — check again shortly. We’ll email you as soon as it’s confirmed, so there’s no need to pay again."
          )}
        </p>

        <dl className={ocMeta}>
          {order.orderNumber ? (
            <div>
              <dt>Order number</dt>
              <dd className={ocMetaNumber}>
                <span dir="ltr">{order.orderNumber}</span>
                <CopyButton value={order.orderNumber} />
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Date</dt>
            <dd>{formatOrderDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd dir="ltr">{formatMoney(Number(totals.total), currency)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{orderPaymentLabel(order.selectedPaymentMethod)}</dd>
          </div>
        </dl>

        <div className={ocActions}>
          {state === "success" ? (
            <>
              <LocaleLink className={checkoutCta} href="/products">
                <span>Continue shopping</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
              {trackHref ? (
                <LocaleLink className={checkoutCtaGhost} href={trackHref}>
                  <span>Track order</span>
                </LocaleLink>
              ) : null}
            </>
          ) : state === "failed" ? (
            <>
              <LocaleLink className={checkoutCta} href={retryHref}>
                <span>Retry payment</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
              <LocaleLink className={checkoutCtaGhost} href="/products">
                <span>Continue shopping</span>
              </LocaleLink>
            </>
          ) : (
            <>
              <button
                type="button"
                className={checkoutCta}
                disabled={settle.isFetching}
                onClick={() => {
                  void settle.refetch();
                  void orderQuery.refetch();
                }}
              >
                <span>{settle.isFetching ? "Checking…" : "Check again"}</span>
                <b aria-hidden="true">↗</b>
              </button>
              <LocaleLink className={checkoutCtaGhost} href={retryHref}>
                <span>Pay now</span>
              </LocaleLink>
            </>
          )}
        </div>
        {!isGuest ? (
          <LocaleLink className={`${checkoutLink} mt-4`} href="/account/orders">
            View all your orders
          </LocaleLink>
        ) : order.orderNumber ? (
          <p className={`${checkoutNote} mt-4`}>Keep your order number — you’ll need it if you contact us about this order.</p>
        ) : null}
      </section>

      <div className={ocBody}>
        <div className={ocStack}>
          {showProgress ? (
            <section className={ocCard} aria-labelledby="order-progress">
              <h2 id="order-progress">What happens next</h2>
              <ol className={ocSteps}>
                {ORDER_PROGRESS_STEPS.map((step, index) => {
                  const status = index < currentStep ? "done" : index === currentStep ? "current" : "todo";
                  return (
                    <li
                      key={step}
                      className={ocStep}
                      data-status={status}
                      aria-current={status === "current" ? "step" : undefined}
                    >
                      <span className={ocStepDot} aria-hidden="true" />
                      <span className={ocStepLabel}>{step}</span>
                      <span className={ocStepHint}>{STEP_HINTS[step]}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}

          <section className={ocCard} aria-labelledby="order-items">
            <h2 id="order-items">
              Items ordered <span className={ocCardCount}>({itemCount})</span>
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
                      <span className={ocLineSub}>{[variant, `Qty ${qty}`].filter(Boolean).join(" · ")}</span>
                      <HistoricalLineDiscount
                        snapshot={line.promotionSnapshot}
                        currency={line.currencyCode || currency}
                        className={ocLineDiscount}
                      />
                    </span>
                    <span className={ocLinePrice} dir="ltr">
                      {formatMoney(Number(line.lineTotal), line.currencyCode || currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className={ocStack}>
          <section className={ocCard} aria-labelledby="order-summary">
            <h2 id="order-summary">Order summary</h2>
            <dl className={checkoutTotals}>
              <div>
                <dt>Subtotal</dt>
                <dd dir="ltr">{formatMoney(Number(totals.subtotal), currency)}</dd>
              </div>
              {Number(totals.discount) > 0 ? (
                <div>
                  <dt>Discount</dt>
                  <dd dir="ltr">−{formatMoney(Number(totals.discount), currency)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Shipping</dt>
                <dd dir="ltr">{shippingTotal > 0 ? formatMoney(shippingTotal, currency) : "Free"}</dd>
              </div>
              {Number(totals.tax) > 0 ? (
                <div>
                  <dt>Tax</dt>
                  <dd dir="ltr">{formatMoney(Number(totals.tax), currency)}</dd>
                </div>
              ) : null}
              <HistoricalGiftNote snapshot={order.promotionSnapshot} className={ocLineDiscount} />
              <div className={checkoutTotalsLine}>
                <dt>Total</dt>
                <dd dir="ltr">{formatMoney(Number(totals.total), currency)}</dd>
              </div>
            </dl>
          </section>

          {hasOrderLoyaltySection(orderReward) ? (
            <div className={ocCard}>
              <OrderRewardNote reward={orderReward} />
            </div>
          ) : null}

          <section className={ocCard} aria-labelledby="order-delivery">
            <h2 id="order-delivery">Delivery &amp; payment</h2>
            {shippingAddress ? <AddressBlock title="Ship to" address={shippingAddress} /> : null}
            {billingAddress ? (
              sameAddress(shippingAddress, billingAddress) ? (
                <div className={ocAddress}>
                  <h3>Bill to</h3>
                  <p className={ocAddressSame}>Same as shipping address</p>
                </div>
              ) : (
                <AddressBlock title="Bill to" address={billingAddress} />
              )
            ) : null}
            <dl className={ocMethods}>
              <div>
                <dt>Delivery</dt>
                <dd>{orderDeliveryLabel(order.selectedDeliveryMethod)}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{orderPaymentLabel(order.selectedPaymentMethod)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </CheckoutStateShell>
  );
}
