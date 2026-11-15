"use client";

import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ORDER_UUID, parseResultHint as tabbyResultHint } from "@/features/checkout/components/TabbyReturnView";
import { parseResultHint as telrResultHint } from "@/features/checkout/components/TelrReturnView";
import { storedOrderIdIf, usePaymentRetry, useSettlePayment } from "@/features/checkout/hooks/usePaymentReturn";
import { storeOrderId } from "@/features/checkout/utils/checkoutSession";
import { TABBY_CANCELLED_MESSAGE, TABBY_REJECTED_MESSAGE, tabbyLang } from "@/features/checkout/utils/tabby";
import { useHydrated } from "@/hooks/useHydrated";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { Breadcrumbs, Button, Eyebrow, Serif, Wrap } from "../../ui";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink } from "../../components/commerce/shared";

/** Sapil frame around the payment screens: breadcrumbs, a white card on paper. */
export function SapilCheckoutStateShell({ children }: { current?: string; children: ReactNode }) {
  const t = useSapilCopy();
  return (
    <Wrap className="pt-[20px] pb-[88px] max-900:pb-[56px]">
      <Breadcrumbs
        label={t("content.breadcrumb")}
        items={[{ label: t("checkout.stepBag"), href: "/cart" }, { label: t("checkout.title") }]}
        LinkComponent={SapilLink}
      />
      <div className="mt-[24px] bg-sapil-white rounded-[28px] py-[40px] px-[36px] max-900:py-[28px] max-900:px-[18px] max-900:rounded-[22px] [&_h1]:font-sapil-display [&_h1]:text-[clamp(30px,3.4vw,40px)]">
        {children}
      </div>
    </Wrap>
  );
}

/** Sapil spinner: navy ring on the paper card, announced politely. */
export function SapilCheckoutSpinner({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <section className="text-center py-[24px]" aria-live="polite" aria-busy="true">
      <span aria-hidden="true" className="block mx-auto mb-[18px] w-[36px] h-[36px] rounded-full border-[3px] border-sapil-line border-t-sapil-accent motion-safe:animate-spin" />
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="font-sapil-display text-[clamp(30px,3.4vw,40px)] mt-[8px]">{title}</h1>
      {body ? <p className="mt-[10px] text-sapil-ink-2">{body}</p> : null}
    </section>
  );
}


type Action = { label: string; href?: string; onClick?: () => void; disabled?: boolean };

/** A payment outcome on the white card: eyebrow, Gloock title with a serif accent, text, actions. */
function PaymentPanel({
  eyebrow,
  title,
  accent,
  body,
  error,
  primary,
  secondary,
  alert,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  body?: string;
  error?: string | null;
  primary?: Action;
  secondary?: Action;
  /** the title itself is the news (provider refusals) */
  alert?: boolean;
}) {
  const action = (a: Action, variant: "dark" | "line") =>
    a.href ? (
      <Button href={a.href} onClick={a.onClick} variant={variant} LinkComponent={SapilLink}>
        {a.label}
      </Button>
    ) : (
      <Button onClick={a.onClick} disabled={a.disabled} variant={variant}>
        {a.label}
      </Button>
    );
  return (
    <section className="text-center py-[16px] max-w-[620px] mx-auto">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 role={alert ? "alert" : undefined} className="font-sapil-display !font-[400] !leading-[1.05] mt-[12px]">
        {title}
        {accent ? (
          <>
            {" "}
            <Serif>{accent}</Serif>
          </>
        ) : null}
      </h1>
      {body ? <p className="mt-[14px] text-[16px] text-sapil-ink-2">{body}</p> : null}
      {error ? (
        <p role="alert" className="mt-[16px] rounded-sapil-sm bg-sapil-p-pink text-sapil-sale text-[14px] py-[12px] px-[16px]">
          {error}
        </p>
      ) : null}
      {primary || secondary ? (
        <div className="mt-[26px] flex flex-wrap justify-center gap-[12px]">
          {primary ? action(primary, "dark") : null}
          {secondary ? action(secondary, "line") : null}
        </div>
      ) : null}
    </section>
  );
}

const retryHref = (orderId: string | null) =>
  orderId ? `/checkout/payment/cancel?orderId=${encodeURIComponent(orderId)}` : "/checkout/payment/cancel";

/* Card forms (Paymob Pixel, Stripe Elements): `SapilCardPayment.tsx`. */

/**
 * Gateway return (Paymob, Stripe after 3-D Secure): polls the platform, which
 * alone decides whether the order is paid (`useSettlePayment`).
 */
export function SapilPaymentSuccess() {
  const t = useSapilCopy();
  const hydrated = useHydrated();
  const orderId = storedOrderIdIf(hydrated);
  const outcome = useSettlePayment(orderId);
  const home = { label: t("checkout.payHome"), href: "/" };

  let body: ReactNode;
  if (!hydrated || (orderId && !outcome)) {
    body = <SapilCheckoutSpinner eyebrow={t("checkout.payment")} title={t("checkout.paymentConfirming")} body={t("checkout.paymentConfirmingBody")} />;
  } else if (outcome?.kind === "paid") {
    body = <SapilCheckoutSpinner eyebrow={t("checkout.payment")} title={t("checkout.payConfirmed")} body={t("checkout.payConfirmedBody")} />;
  } else if (!orderId) {
    body = <PaymentPanel eyebrow={t("checkout.payNoOrderEyebrow")} title={t("checkout.payNoOrderTitle")} body={t("checkout.payNoOrderBody")} primary={home} />;
  } else if (outcome?.kind === "timeout") {
    body = (
      <PaymentPanel
        eyebrow={t("checkout.payPendingEyebrow")}
        title={t("checkout.payPendingTitle")}
        accent={t("checkout.payPendingAccent")}
        body={t("checkout.payPendingBody")}
        primary={{ label: t("checkout.payOrderStatus"), href: `/order-confirmation/${orderId}?verify=1` }}
        secondary={home}
      />
    );
  } else {
    const declined = outcome?.kind === "failed" && outcome.status === "DECLINED";
    body = (
      <PaymentPanel
        eyebrow={t(declined ? "checkout.payDeclinedEyebrow" : "checkout.payFailedEyebrow")}
        title={t("checkout.payFailedTitle")}
        accent={t("checkout.payFailedAccent")}
        body={t(declined ? "checkout.payDeclinedBody" : "checkout.payFailedBody")}
        primary={{ label: t("checkout.payTryAgain"), href: "/checkout/payment/cancel" }}
        secondary={home}
      />
    );
  }
  return <SapilCheckoutStateShell>{body}</SapilCheckoutStateShell>;
}

/** Gateway cancel URL and the retry screen for a placed-but-unpaid order (the order is kept). */
export function SapilPaymentCancel() {
  const t = useSapilCopy();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const { orderId, orderNumber, retrying, error, retry } = usePaymentRetry({
    queryOrderId: searchParams.get("orderId"),
    storedOrderId: storedOrderIdIf(hydrated),
    gatewayReason: searchParams.get("reason") === "gateway",
  });
  const errorText = !error
    ? null
    : error.kind === "gateway"
      ? t("checkout.payGatewayError")
      : error.kind === "rejected"
        ? error.message
        : error.message || t("checkout.payRetryError");

  return (
    <SapilCheckoutStateShell>
      {hydrated && !orderId ? (
        <PaymentPanel
          eyebrow={t("checkout.payNoOrderEyebrow")}
          title={t("checkout.paySessionEndedTitle")}
          body={t("checkout.paySessionEndedBody")}
          primary={{ label: t("checkout.payBackToBag"), href: "/cart" }}
        />
      ) : (
        <PaymentPanel
          eyebrow={t("checkout.paySavedEyebrow")}
          title={t("checkout.paySavedTitle")}
          accent={t("checkout.paySavedAccent")}
          body={orderNumber ? t("checkout.paySavedBodyNumber", { number: orderNumber }) : t("checkout.paySavedBody")}
          error={errorText}
          primary={{
            label: t(retrying ? "checkout.payRetrying" : "checkout.payRetry"),
            onClick: () => void retry(),
            disabled: retrying || !hydrated,
          }}
          secondary={{ label: t("checkout.payHome"), href: "/" }}
        />
      )}
    </SapilCheckoutStateShell>
  );
}

/**
 * Tabby hosted-page return. `result=` is only a hint: the platform decides.
 * Refusals use Tabby's own required wording (English / Arabic).
 */
export function SapilTabbyReturn() {
  const t = useSapilCopy();
  const locale = useShopLocale();
  const lang = tabbyLang(locale);
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const hint = useMemo(() => tabbyResultHint(searchParams.get("result")), [searchParams]);
  const queryOrderId = searchParams.get("orderId");
  const orderId = hydrated ? (queryOrderId && ORDER_UUID.test(queryOrderId) ? queryOrderId : storedOrderIdIf(true)) : null;
  const settlement = useSettlePayment(orderId);
  const home = { label: t("checkout.payHome"), href: "/" };
  const refused = hint === "cancel" || hint === "failure";

  let body: ReactNode;
  if (!hydrated || (orderId && !settlement)) {
    body = <SapilCheckoutSpinner eyebrow={t("checkout.payPendingEyebrow")} title={t(refused ? "checkout.payChecking" : "checkout.paymentConfirming")} body={t("checkout.payDontClose")} />;
  } else if (settlement?.kind === "paid") {
    body = <SapilCheckoutSpinner eyebrow="Tabby" title={t("checkout.payConfirmed")} body={t("checkout.payConfirmedBody")} />;
  } else if (settlement?.kind === "failed" || refused) {
    const cancelled = hint === "cancel";
    body = (
      <PaymentPanel
        alert
        eyebrow={t(cancelled ? "checkout.payCancelledEyebrow" : "checkout.payDeclinedEyebrow")}
        title={(cancelled ? TABBY_CANCELLED_MESSAGE : TABBY_REJECTED_MESSAGE)[lang]}
        primary={{
          label: t("checkout.payOtherMethod"),
          href: retryHref(orderId),
          onClick: () => {
            if (orderId) storeOrderId(orderId);
          },
        }}
        secondary={home}
      />
    );
  } else if (!orderId) {
    body = <PaymentPanel eyebrow={t("checkout.payNoOrderEyebrow")} title={t("checkout.payNoOrderTitle")} body={t("checkout.payNoOrderBody")} primary={home} />;
  } else {
    body = (
      <PaymentPanel
        eyebrow={t("checkout.payPendingEyebrow")}
        title={t("checkout.payPendingTitle")}
        accent={t("checkout.payPendingAccent")}
        body={t("checkout.payPendingBody")}
        primary={{ label: t("checkout.payOrderStatus"), href: `/order-confirmation/${orderId}?verify=1` }}
        secondary={home}
      />
    );
  }
  return <SapilCheckoutStateShell>{body}</SapilCheckoutStateShell>;
}

/** Telr hosted-page return. `result=` is only a hint: the platform decides. */
export function SapilTelrReturn() {
  const t = useSapilCopy();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const hint = useMemo(() => telrResultHint(searchParams.get("result")), [searchParams]);
  const orderId = storedOrderIdIf(hydrated);
  const settlement = useSettlePayment(orderId);
  const home = { label: t("checkout.payHome"), href: "/" };
  const refusedHint = hint === "declined" || hint === "cancelled";
  const statusAction = (id: string) => ({ label: t("checkout.payOrderStatus"), href: `/order-confirmation/${id}?verify=1` });

  let body: ReactNode;
  if (!hydrated || (orderId && !settlement)) {
    body = (
      <SapilCheckoutSpinner
        eyebrow={t(hint === "declined" ? "checkout.payDeclinedEyebrow" : hint === "cancelled" ? "checkout.payCancelledEyebrow" : "checkout.payBankEyebrow")}
        title={refusedHint ? t("checkout.payChecking") : `${t("checkout.payBankTitle")} ${t("checkout.payBankAccent")}`}
        body={t("checkout.payDontClose")}
      />
    );
  } else if (settlement?.kind === "paid") {
    body = <SapilCheckoutSpinner eyebrow={t("checkout.payment")} title={t("checkout.payConfirmed")} body={t("checkout.payConfirmedBody")} />;
  } else if (orderId && settlement?.kind === "timeout") {
    body = (
      <PaymentPanel
        eyebrow={t("checkout.payPendingEyebrow")}
        title={t("checkout.payPendingTitle")}
        accent={t("checkout.payPendingAccent")}
        body={t(refusedHint ? "checkout.payPendingCheckBody" : "checkout.payPendingBody")}
        primary={statusAction(orderId)}
        secondary={home}
      />
    );
  } else if (orderId && settlement?.kind === "failed") {
    const cancelled = settlement.status === "CANCELLED";
    const declined = settlement.status === "DECLINED";
    body = (
      <PaymentPanel
        eyebrow={t(cancelled ? "checkout.payCancelledEyebrow" : declined ? "checkout.payDeclinedEyebrow" : "checkout.payFailedEyebrow")}
        title={t("checkout.payFailedTitle")}
        accent={t("checkout.payFailedAccent")}
        body={t(cancelled ? "checkout.payCancelledBody" : declined ? "checkout.payDeclinedBody" : "checkout.payFailedBody")}
        primary={{ label: t("checkout.payTryAgain"), href: retryHref(orderId) }}
        secondary={home}
      />
    );
  } else {
    // No order placed in this browser: all we have is Telr's hint.
    body = (
      <PaymentPanel
        eyebrow={t(hint === "declined" ? "checkout.payDeclinedEyebrow" : hint === "cancelled" ? "checkout.payCancelledEyebrow" : "checkout.payBankEyebrow")}
        title={t("checkout.payNoOrderTitle")}
        body={t("checkout.payNoOrderBody")}
        primary={home}
      />
    );
  }
  return <SapilCheckoutStateShell>{body}</SapilCheckoutStateShell>;
}
