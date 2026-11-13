"use client";

import type { ReactNode } from "react";
import { CheckoutElementsProvider, PaymentElement } from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutSession } from "@stripe/stripe-js";
import type { OrderResponse } from "@/features/checkout/types/checkout";
import { useCardPaymentSession } from "@/features/checkout/hooks/useCardPaymentSession";
import { usePaymobCardForm, type PaymobPayError } from "@/features/checkout/hooks/usePaymobCardForm";
import { useStripeCardPayment, type StripePayError } from "@/features/checkout/hooks/useStripeCardPayment";
import { useStripePromise, useStripeSessionOptions } from "@/features/checkout/hooks/useStripeSessionOptions";
import type { StripeElementsLook } from "@/features/checkout/utils/stripeCheckoutAppearance";
import { usePaymobThreeDsModal } from "@/features/checkout/components/PaymobThreeDsModal";
import { showsDistinctSize } from "@/features/cart/utils/showsDistinctSize";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { Button, Eyebrow, Serif } from "../../ui";
import type { SapilLinkProps } from "../../ui/shared";
import { OrderSummary, type SummaryLine, type SummaryTotalRow } from "../../components/checkout/CheckoutParts";
import { SapilLink, useSapilMoney, useSapilMoneyParts } from "../../components/commerce/shared";
import { SapilCheckoutSpinner, SapilCheckoutStateShell } from "./SapilPaymentScreens";

/*
 * `/checkout/payment/stripe` and `/checkout/payment/paymob` in v9 style. The
 * provider logic is shared (useCardPaymentSession, useStripeCardPayment,
 * usePaymobCardForm); this file is only Sapil's look and wording.
 */

const CANCEL_HREF = "/checkout/payment/cancel";

/** v9 tokens for the providers' card fields (their iframes can't read our CSS variables). */
const SAPIL_FIELD = {
  ink: "#1e1b18",
  ink2: "#4a443d",
  muted: "#6f665b",
  line: "#d6cdc0",
  accent: "#16305c",
  sale: "#9a3b2a",
  card: "#fffdfa",
};

const STRIPE_LOOK: StripeElementsLook = {
  fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" }],
  appearance: {
    theme: "stripe",
    variables: {
      fontFamily: "Poppins, system-ui, sans-serif",
      fontSizeBase: "15px",
      colorPrimary: SAPIL_FIELD.accent,
      colorBackground: SAPIL_FIELD.card,
      colorText: SAPIL_FIELD.ink,
      colorTextSecondary: SAPIL_FIELD.ink2,
      colorTextPlaceholder: SAPIL_FIELD.muted,
      colorDanger: SAPIL_FIELD.sale,
      borderRadius: "10px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { border: `1px solid ${SAPIL_FIELD.line}`, boxShadow: "none" },
      ".Input:focus": { border: `1px solid ${SAPIL_FIELD.ink}`, boxShadow: "none" },
      ".AccordionItem": { border: `1px solid ${SAPIL_FIELD.line}`, boxShadow: "none" },
    },
  },
};

const PAYMOB_STYLE = {
  Font_Family: "Poppins, system-ui, sans-serif",
  Font_Size_Label: "14",
  Font_Size_Input_Fields: "15",
  Font_Size_Payment_Button: "15",
  Font_Weight_Label: 600,
  Font_Weight_Input_Fields: 400,
  Font_Weight_Payment_Button: 600,
  Color_Container: SAPIL_FIELD.card,
  Color_Border_Input_Fields: SAPIL_FIELD.line,
  Color_Border_Payment_Button: SAPIL_FIELD.ink,
  Radius_Border: "10",
  Color_Disabled: SAPIL_FIELD.muted,
  Color_Error: SAPIL_FIELD.sale,
  Color_Primary: SAPIL_FIELD.accent,
  Color_Input_Fields: "#ffffff",
  Text_Color_For_Label: SAPIL_FIELD.ink,
  Text_Color_For_Payment_Button: "#ffffff",
  Text_Color_For_Input_Fields: SAPIL_FIELD.ink,
  Color_For_Text_Placeholder: SAPIL_FIELD.muted,
  Width_of_Container: "100%",
  // Pixel treats this as the input height in pixels (v9 fields are 48px).
  Vertical_Padding: "48",
  Vertical_Spacing_between_components: "14",
  Container_Padding: "0",
};

const PAYMOB_ELEMENT_ID = "paymob-elements";

function paymobErrorText(t: SapilTranslator, error: PaymobPayError): string {
  if (error === "timeout") return t("checkout.cardErrTimeout");
  if (error === "declined") return t("checkout.cardErrDeclinedRetry");
  return t("checkout.cardErrUnconfirmed");
}

function stripeErrorText(t: SapilTranslator, error: StripePayError): string {
  switch (error.code) {
    case "insufficient_funds":
      return t("checkout.cardErrInsufficient");
    case "card_declined":
      return t("checkout.cardErrDeclined");
    case "expired_card":
      return t("checkout.cardErrExpired");
    case "incorrect_cvc":
      return t("checkout.cardErrCvc");
    case "invalid_number":
      return t("checkout.cardErrNumber");
    case "processing_error":
      return t("checkout.cardErrProcessing");
    case "session_has_email":
      return t("checkout.cardErrSessionEmail");
    case "needs_email":
      return t("checkout.cardErrNeedsEmail");
    case "needs_phone":
      return t("checkout.cardErrNeedsPhone");
    case "needs_name":
      return t("checkout.cardErrNeedsName");
    default:
      // Provider sentences are English: keep the page in its language.
      return t("checkout.cardErrFailed");
  }
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-sapil-sm bg-sapil-p-pink text-sapil-sale text-[14px] py-[12px] px-[16px]">
      {children}
    </p>
  );
}

/** Order lines carry no product address: the name is plain text. */
function LineName({ children, className }: SapilLinkProps) {
  return <span className={className}>{children}</span>;
}

/** The order being paid, in the checkout's summary card. */
function PaidOrderSummary({ order, payable }: { order: OrderResponse | undefined; payable?: { amount: number; currency: string } | null }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const moneyParts = useSapilMoneyParts();
  if (!order) return null;
  const currency = order.currency;
  const lines: SummaryLine[] = order.lines.map((line) => {
    const name = line.productName ?? line.sku;
    return {
      key: line.orderLineId,
      name,
      href: "/products",
      imageSrc: line.imageUrl?.startsWith("http") ? line.imageUrl : undefined,
      quantity: Number.parseInt(line.quantity, 10) || 1,
      meta: showsDistinctSize(name, line.variantName ?? undefined) ? line.variantName : undefined,
      price: money(Number(line.lineTotal), line.currencyCode || currency),
    };
  });
  const totals = order.totals;
  const rows: SummaryTotalRow[] = [{ key: "sub", label: t("checkout.subtotal"), value: money(Number(totals.subtotal), currency) }];
  if (Number(totals.discount) > 0) {
    rows.push({ key: "disc", label: t("checkout.discount"), value: `−${money(Number(totals.discount), currency)}`, tone: "save" });
  }
  const shipping = Number(totals.shipping);
  rows.push({ key: "ship", label: t("checkout.delivery"), value: shipping > 0 ? money(shipping, currency) : t("checkout.deliveryFree") });
  if (Number(totals.tax) > 0) rows.push({ key: "tax", label: "VAT", value: money(Number(totals.tax), currency) });
  const grand = moneyParts(payable?.amount ?? Number(totals.total), payable?.currency ?? currency);
  return (
    <OrderSummary
      open
      lines={lines}
      rows={rows}
      grand={{ label: t("checkout.total"), currency: grand.currency, amount: grand.amount }}
      trust={[]}
      LinkComponent={LineName}
    />
  );
}

/** Page frame: heading, the card box (form slot), the cancel note, and the order beside it. */
function CardPaymentLayout({
  order,
  brands,
  secured,
  summary,
  children,
}: {
  order: OrderResponse | undefined;
  brands: string;
  secured: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  const t = useSapilCopy();
  return (
    <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[56px] items-start max-900:grid-cols-[1fr] max-900:gap-[24px]">
      <div className="min-w-0">
        <Eyebrow>{t("checkout.payment")}</Eyebrow>
        <h1 className="!font-[400] !leading-[1.05] mt-[10px]">
          {t("checkout.cardPayTitle")} <Serif>{t("checkout.cardPayAccent")}</Serif>
        </h1>
        <p className="mt-[10px] text-sapil-ink-2">
          {order?.orderNumber ? t("checkout.cardPayLeadNumber", { number: order.orderNumber }) : t("checkout.cardPayLead")}
        </p>
        <section aria-labelledby="card-payment-heading" className="mt-[24px] rounded-[20px] border border-sapil-line p-[24px] max-600:p-[16px]">
          <div className="flex items-center gap-[10px] flex-wrap mb-[18px]">
            <span className="grid place-items-center w-[32px] h-[32px] rounded-full bg-sapil-accent-soft text-sapil-accent">
              <LockIcon />
            </span>
            <h2 id="card-payment-heading" className="!font-sapil-sans !font-[700] !text-[18px] !tracking-[-.01em]">
              {t("checkout.cardDetails")}
            </h2>
            <span className="ms-auto text-[13px] text-sapil-muted">{t("checkout.cardBrandsAccepted", { brands })}</span>
          </div>
          <div className="flex flex-col gap-[14px]">{children}</div>
          <p className="mt-[16px] flex items-start gap-[8px] text-[13px] text-sapil-muted">
            <LockIcon />
            <span>{secured}</span>
          </p>
        </section>
        <p className="mt-[16px] text-[14px] text-sapil-ink-2">
          {t("checkout.cardChangedMind")}{" "}
          <SapilLink href={CANCEL_HREF} className="underline font-[600]">
            {t("checkout.cardCancel")}
          </SapilLink>
        </p>
      </div>
      {summary}
    </div>
  );
}

function Confirming() {
  const t = useSapilCopy();
  return (
    <div className="text-center py-[24px]" aria-live="polite" aria-busy="true">
      <span aria-hidden="true" className="block mx-auto mb-[14px] w-[32px] h-[32px] rounded-full border-[3px] border-sapil-line border-t-sapil-accent motion-safe:animate-spin" />
      <p className="font-[600]">{t("checkout.paymentConfirming")}</p>
      <p className="text-[14px] text-sapil-ink-2">{t("checkout.paymentConfirmingBody")}</p>
    </div>
  );
}

function ExpiredSession() {
  const t = useSapilCopy();
  return (
    <section className="text-center py-[16px] max-w-[620px] mx-auto">
      <Eyebrow>{t("checkout.payment")}</Eyebrow>
      <h1 className="!font-[400] !leading-[1.05] mt-[12px]">
        {t("checkout.cardExpiredTitle")} <Serif>{t("checkout.cardExpiredAccent")}</Serif>
      </h1>
      <p className="mt-[14px] text-[16px] text-sapil-ink-2">{t("checkout.cardExpiredBody")}</p>
      <div className="mt-[26px] flex flex-wrap justify-center gap-[12px]">
        <Button href={CANCEL_HREF} LinkComponent={SapilLink}>
          {t("checkout.payRetry")}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Stripe */

function sessionPayable(session: StripeCheckoutSession): { amount: number; currency: string } {
  const divisor = session.minorUnitsAmountDivisor || 100;
  return { amount: session.total.total.minorUnitsAmount / divisor, currency: session.currency.toUpperCase() };
}

function SapilStripeForm({ orderId, order }: { orderId: string; order: OrderResponse | undefined }) {
  const t = useSapilCopy();
  const shipping = order?.addresses?.find((a) => a.addressType === "SHIPPING");
  const pay = useStripeCardPayment({
    orderId,
    email: order?.customer?.email,
    name: order?.customer?.fullName ?? shipping?.fullName,
    phone: typeof order?.metadata?.customerPhone === "string" ? order.metadata.customerPhone : null,
    country: shipping?.countryCode,
  });
  const payable = pay.checkoutState.type === "success" ? sessionPayable(pay.checkoutState.checkout) : null;
  const money = useSapilMoney();
  const busy = pay.phase === "confirming";

  return (
    <CardPaymentLayout
      order={order}
      brands={t("checkout.cardStripeBrands")}
      secured={t("checkout.cardSecuredStripe")}
      summary={<PaidOrderSummary order={order} payable={payable} />}
    >
      {pay.sessionError ? (
        <ErrorNote>
          {stripeErrorText(t, pay.sessionError)}{" "}
          <SapilLink href={CANCEL_HREF} className="underline font-[600]">
            {t("checkout.payOtherMethod")}
          </SapilLink>
        </ErrorNote>
      ) : null}
      {pay.phase === "polling" ? (
        <Confirming />
      ) : (
        <>
          {!pay.ready && !pay.loadFailed && !pay.sessionError ? (
            <p role="status" className="text-[14px] text-sapil-muted">
              {t("checkout.cardFormLoading")}
            </p>
          ) : null}
          {pay.loadFailed && !pay.sessionError ? (
            <ErrorNote>
              {t("checkout.cardFormFailed")}{" "}
              <SapilLink href={CANCEL_HREF} className="underline font-[600]">
                {t("checkout.payOtherMethod")}
              </SapilLink>
            </ErrorNote>
          ) : null}
          <div className={pay.ready ? undefined : "min-h-[220px]"}>
            <PaymentElement
              options={{
                layout: { type: "accordion", defaultCollapsed: false, radios: "always", spacedAccordionItems: true },
                paymentMethodOrder: ["card"],
                wallets: { applePay: "never", googlePay: "never", link: "never" },
                fields: { billingDetails: { name: "never", email: "never", phone: "never", address: "never" } },
              }}
              onReady={pay.onReady}
              onLoadError={pay.onLoadError}
            />
          </div>
          {pay.error ? <ErrorNote>{stripeErrorText(t, pay.error)}</ErrorNote> : null}
          <Button className="w-full" disabled={!pay.canPay} aria-busy={busy || undefined} onClick={() => void pay.confirm(orderId)}>
            {busy
              ? t("checkout.cardProcessing")
              : payable
                ? t("checkout.payAmount", { amount: money(payable.amount, payable.currency) })
                : t("checkout.cardPayNow")}
          </Button>
        </>
      )}
    </CardPaymentLayout>
  );
}

export function SapilStripePaymentForm() {
  const t = useSapilCopy();
  const session = useCardPaymentSession("stripe");
  const stripePromise = useStripePromise(session.providerKey);
  const options = useStripeSessionOptions(session.clientSecret, session.order, STRIPE_LOOK);

  let body: ReactNode;
  if (!session.hydrated || session.alreadyPaid) {
    body = <SapilCheckoutSpinner eyebrow={t("checkout.payment")} title={t("checkout.cardLoadingPayment")} />;
  } else if (session.expired || !session.orderId || !stripePromise || !options) {
    body = <ExpiredSession />;
  } else {
    body = (
      <CheckoutElementsProvider stripe={stripePromise} options={options}>
        <SapilStripeForm orderId={session.orderId} order={session.order} />
      </CheckoutElementsProvider>
    );
  }
  return <SapilCheckoutStateShell>{body}</SapilCheckoutStateShell>;
}

/* ------------------------------------------------------------------ Paymob */

export function SapilPaymobPaymentForm() {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const session = useCardPaymentSession("paymob");
  const threeDs = usePaymobThreeDsModal(session.orderId);
  const card = usePaymobCardForm({
    orderId: session.orderId,
    clientSecret: session.clientSecret,
    publicKey: session.providerKey,
    enabled: !session.alreadyPaid,
    elementId: PAYMOB_ELEMENT_ID,
    customStyle: PAYMOB_STYLE,
  });

  let body: ReactNode;
  if (!session.hydrated || session.alreadyPaid) {
    body = <SapilCheckoutSpinner eyebrow={t("checkout.payment")} title={t("checkout.cardLoadingPayment")} />;
  } else if (session.expired) {
    body = <ExpiredSession />;
  } else {
    const order = session.order;
    const total = order ? money(Number(order.totals.total), order.currency) : null;
    const busy = card.phase === "confirming";
    body = (
      <>
        <CardPaymentLayout
          order={order}
          brands={t("checkout.cardPaymobBrands")}
          secured={t("checkout.cardSecuredPaymob")}
          summary={<PaidOrderSummary order={order} />}
        >
          {card.phase === "polling" ? (
            <Confirming />
          ) : (
            <>
              {threeDs.challengeError ? <ErrorNote>{threeDs.challengeError}</ErrorNote> : null}
              {card.sdkFailed ? (
                <ErrorNote>
                  {t("checkout.cardFormFailed")}{" "}
                  <SapilLink href={CANCEL_HREF} className="underline font-[600]">
                    {t("checkout.payOtherMethod")}
                  </SapilLink>
                </ErrorNote>
              ) : null}
              <div id={PAYMOB_ELEMENT_ID} className="w-full" />
              {card.error ? (
                <ErrorNote>
                  {paymobErrorText(t, card.error)}
                  {card.needsRetry ? (
                    <>
                      {" "}
                      <SapilLink href={CANCEL_HREF} className="underline font-[600]">
                        {t("checkout.cardStartNew")}
                      </SapilLink>
                    </>
                  ) : null}
                </ErrorNote>
              ) : null}
              <Button className="w-full" disabled={!card.canPay} aria-busy={busy || undefined} onClick={card.pay}>
                {busy ? t("checkout.cardProcessing") : total ? t("checkout.payAmount", { amount: total }) : t("checkout.cardPayNow")}
              </Button>
            </>
          )}
        </CardPaymentLayout>
        {threeDs.overlay}
      </>
    );
  }
  return <SapilCheckoutStateShell>{body}</SapilCheckoutStateShell>;
}
