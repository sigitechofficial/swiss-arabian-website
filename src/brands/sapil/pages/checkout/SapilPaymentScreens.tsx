"use client";

import type { ReactNode } from "react";
import {
  PaymentCancelView,
  PaymentSuccessView,
  PaymobPaymentFormView,
  StripePaymentFormView,
  TabbyReturnView,
  TelrReturnView,
} from "@/features/checkout";
import { CheckoutStateUiProvider, type CheckoutStateUi } from "@/features/checkout/components/CheckoutStateShell";
import { Breadcrumbs, Eyebrow, Wrap } from "../../ui";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink } from "../../components/commerce/shared";

/** Sapil frame around the payment screens: breadcrumbs, a white card on paper. */
export function SapilCheckoutStateShell({ children }: { current: string; children: ReactNode }) {
  const t = useSapilCopy();
  return (
    <Wrap as="main" className="pt-[20px] pb-[88px] max-900:pb-[56px]">
      <Breadcrumbs items={[{ label: t("checkout.stepBag"), href: "/cart" }, { label: t("checkout.title") }]} LinkComponent={SapilLink} />
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

const SAPIL_STATE_UI: CheckoutStateUi = { Shell: SapilCheckoutStateShell, Spinner: SapilCheckoutSpinner };

/*
 * The provider screens keep Swiss Arabian's logic (Paymob Pixel, Stripe Elements,
 * Tabby / Telr returns, payment status polling) untouched; Sapil supplies their
 * shell and spinner through CheckoutStateUiProvider.
 */
export function SapilPaymobPaymentForm() {
  return (
    <CheckoutStateUiProvider ui={SAPIL_STATE_UI}>
      <PaymobPaymentFormView />
    </CheckoutStateUiProvider>
  );
}
export function SapilStripePaymentForm() {
  return (
    <CheckoutStateUiProvider ui={SAPIL_STATE_UI}>
      <StripePaymentFormView />
    </CheckoutStateUiProvider>
  );
}
export function SapilPaymentSuccess() {
  return (
    <CheckoutStateUiProvider ui={SAPIL_STATE_UI}>
      <PaymentSuccessView />
    </CheckoutStateUiProvider>
  );
}
export function SapilPaymentCancel() {
  return (
    <CheckoutStateUiProvider ui={SAPIL_STATE_UI}>
      <PaymentCancelView />
    </CheckoutStateUiProvider>
  );
}
export function SapilTabbyReturn() {
  return (
    <CheckoutStateUiProvider ui={SAPIL_STATE_UI}>
      <TabbyReturnView />
    </CheckoutStateUiProvider>
  );
}
export function SapilTelrReturn() {
  return (
    <CheckoutStateUiProvider ui={SAPIL_STATE_UI}>
      <TelrReturnView />
    </CheckoutStateUiProvider>
  );
}
