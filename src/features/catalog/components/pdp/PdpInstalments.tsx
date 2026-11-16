"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { env } from "@/lib/config/env";
import { TabbyPromoSnippet } from "@/features/payments/tabby/TabbyPromoSnippet";
import { giftChoiceBackdrop, giftChoiceRoot } from "@/styles/cartChrome";
import {
  pdpPay,
  pdpPayAmount,
  pdpPayBadge,
  pdpPayBtn,
  pdpPayBtnMore,
  pdpPayClose,
  pdpPayDialog,
  pdpPayDone,
  pdpPayEyebrow,
  pdpPayFoot,
  pdpPayHead,
  pdpPayHeading,
  pdpPayLede,
  pdpPayMarkTamara,
  pdpPayNote,
  pdpPayOffer,
  pdpPayPlan,
  pdpPayRing,
  pdpPaySoon,
  pdpPayStep,
  pdpPaySteps,
  pdpPayTitle,
  pdpPayTop,
  pdpPayTrack,
  pdpPayTrackRing,
  pdpPayTrackStep,
  pdpPayWhen,
} from "@/styles/pdpChrome";

type Provider = "tamara";

/**
 * Our own pay-in-4 card is for Tamara only. Tabby is shown with Tabby's official
 * snippet (Tabby QA, Nov 2026): a fixed "4 payments, 0% interest" promise can
 * contradict the plans and fees Tabby really offers for a price.
 */
const PROVIDERS: Record<Provider, { name: string; mark: string; live: boolean }> = {
  tamara: { name: "Tamara", mark: pdpPayMarkTamara, live: env.flags.tamara },
};

const WHEN = ["Today", "In 1 month", "In 2 months", "In 3 months"] as const;

/** Four payments to the cent. The last one carries whatever rounding left over, so they add up to the price. */
export function payInFour(price: number): number[] {
  const cents = Math.round(price * 100);
  const each = Math.floor(cents / 4);
  return [each, each, each, cents - each * 3].map((value) => value / 100);
}

/** Escape closes, the page behind stops scrolling, and focus starts on the close button. */
function useDialogChrome(onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return closeRef;
}

function PayRing({ quarters, className = pdpPayRing }: { quarters: number; className?: string }) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        background: `conic-gradient(var(--copper, #8c4435) ${quarters * 90}deg, rgb(140 68 53 / 0.14) 0)`,
        mask: "radial-gradient(circle, transparent 52%, #000 54%)",
        WebkitMask: "radial-gradient(circle, transparent 52%, #000 54%)",
      }}
    />
  );
}

function PayDialog({
  provider,
  price,
  currency,
  onClose,
}: {
  provider: Provider;
  price: number;
  currency: string;
  onClose: () => void;
}) {
  const { name, mark, live } = PROVIDERS[provider];
  const titleId = useId();
  const closeRef = useDialogChrome(onClose);
  const payments = payInFour(price);

  return createPortal(
    <div className={giftChoiceRoot}>
      <button type="button" className={giftChoiceBackdrop} aria-label="Close" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={pdpPayDialog}>
        <button type="button" className={pdpPayClose} aria-label="Close" onClick={onClose} ref={closeRef}>
          <X size={18} />
        </button>

        <span className={mark}>{name}</span>
        <p className={pdpPayTitle} id={titleId}>
          Pay in 4, interest-free
        </p>
        <p className={pdpPayLede}>
          Split <strong>{formatMoney(price, currency)}</strong> into 4 payments with {name}. No interest.
        </p>

        <ol className={pdpPayPlan} aria-label="Payment schedule">
          {payments.map((amount, index) => (
            <li className={pdpPayStep} key={WHEN[index]}>
              <PayRing quarters={index + 1} />
              <p className={pdpPayAmount}>{formatMoney(amount, currency)}</p>
              <p className={pdpPayWhen}>{WHEN[index]}</p>
            </li>
          ))}
        </ol>

        <p className={pdpPayHeading}>How it works</p>
        <ol className={pdpPaySteps}>
          <li>Add your fragrances to the bag and go to checkout.</li>
          <li>Choose {name} as your payment method.</li>
          <li>Enter your details with {name} and pay the first instalment.</li>
          <li>The other three are collected automatically, one a month.</li>
        </ol>

        {live ? null : <p className={pdpPaySoon}>{name} is coming soon to our checkout.</p>}

        <p className={pdpPayNote}>
          {name} decides approval and sets the payment terms. The schedule above is for this item at
          today’s price; your bag total may differ.
        </p>

        <button type="button" className={pdpPayDone} onClick={onClose}>
          Got it
        </button>
      </section>
    </div>,
    document.body,
  );
}

/**
 * Instalments under the price: Tabby's official snippet (only in markets where
 * checkout offers Tabby), then our pay-in-4 card for Tamara.
 */
export function PdpInstalments({ price, currency }: { price: number; currency: string }) {
  return (
    <>
      <TabbyPromoSnippet amount={price} currency={currency} source="product" className="mb-3" />
      <TamaraInstalments price={price} currency={currency} />
    </>
  );
}

function TamaraInstalments({ price, currency }: { price: number; currency: string }) {
  const [open, setOpen] = useState<Provider | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const each = formatMoney(payInFour(price)[0], currency);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  return (
    <>
      <section className={pdpPay} aria-label="Pay in instalments">
        <div className={pdpPayHead}>
          <div className={pdpPayTop}>
            <div className="min-w-0">
              <p className={pdpPayEyebrow}>Pay in 4</p>
              <p className={pdpPayOffer}>
                4 payments of <strong>{each}</strong>
              </p>
            </div>
            <span className={pdpPayBadge}>0% interest</span>
          </div>
          <ol className={pdpPayTrack} aria-label="Payment schedule">
            {WHEN.map((when, index) => (
              <li className={pdpPayTrackStep} data-now={index === 0} key={when}>
                <PayRing quarters={index + 1} className={pdpPayTrackRing} />
                {/* The narrowest phones drop "In" so four labels still fit side by side. */}
                <span>
                  {when.startsWith("In ") ? <span className="max-[380px]:hidden">In </span> : null}
                  {when.replace(/^In /, "")}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className={pdpPayFoot}>
          {(Object.keys(PROVIDERS) as Provider[]).map((provider) => {
            const { name, mark } = PROVIDERS[provider];
            return (
              <button
                type="button"
                className={pdpPayBtn}
                aria-haspopup="dialog"
                key={provider}
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setOpen(provider);
                }}
              >
                <span className={mark}>{name}</span>
                <span className={pdpPayBtnMore}>
                  Learn more
                  {/* Visible text stays in the accessible name ("Tabby Learn more about paying with Tabby"). */}
                  <span className="sr-only"> about paying with {name}</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
      {open ? <PayDialog provider={open} price={price} currency={currency} onClose={close} /> : null}
    </>
  );
}
