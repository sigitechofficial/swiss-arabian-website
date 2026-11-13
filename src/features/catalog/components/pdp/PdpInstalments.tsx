"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { giftChoiceBackdrop, giftChoiceRoot } from "@/styles/cartChrome";
import { useInstalmentPlan } from "../../hooks/useInstalmentPlan";
import {
  INSTALMENT_PROVIDERS,
  payInFour,
  type InstalmentProvider,
} from "../../utils/instalments";
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
  pdpPayFrame,
  pdpPayFrameClose,
  pdpPayFrameDialog,
  pdpPayFrameSoon,
  pdpPayHead,
  pdpPayHeading,
  pdpPayLede,
  pdpPayMarkTabby,
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

type Provider = InstalmentProvider;

const PROVIDERS: Record<Provider, { name: string; mark: string; live: boolean }> = {
  tamara: { ...INSTALMENT_PROVIDERS.tamara, mark: pdpPayMarkTamara },
  tabby: { ...INSTALMENT_PROVIDERS.tabby, mark: pdpPayMarkTabby },
};

const WHEN = ["Today", "In 1 month", "In 2 months", "In 3 months"] as const;

export { payInFour, tabbyPopupUrl } from "../../utils/instalments";

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

export function TabbyDialog({ src, onClose }: { src: string; onClose: () => void }) {
  const closeRef = useDialogChrome(onClose);

  return createPortal(
    <div className={giftChoiceRoot}>
      <button type="button" className={giftChoiceBackdrop} aria-label="Close" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label="Tabby payment plans" className={pdpPayFrameDialog}>
        <button type="button" className={pdpPayFrameClose} aria-label="Close" onClick={onClose} ref={closeRef}>
          <X size={18} />
        </button>
        <iframe
          className={pdpPayFrame}
          src={src}
          title="Tabby payment plans"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {PROVIDERS.tabby.live ? null : <p className={pdpPayFrameSoon}>Tabby is coming soon to our checkout.</p>}
      </section>
    </div>,
    document.body,
  );
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
 * Pay-in-4 card under the price: the offer and its schedule once, then a button per provider.
 * Tabby opens Tabby's own pop-up; Tamara opens our schedule dialog.
 */
export function PdpInstalments({ price, currency }: { price: number; currency: string }) {
  const plan = useInstalmentPlan(price, currency);
  const { open, tabbyUrl, close } = plan;
  const each = formatMoney(plan.each, currency);

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
                onClick={(event) => plan.openProvider(provider, event.currentTarget)}
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
      {open === "tabby" && tabbyUrl ? (
        <TabbyDialog src={tabbyUrl} onClose={close} />
      ) : open ? (
        <PayDialog provider={open} price={price} currency={currency} onClose={close} />
      ) : null}
    </>
  );
}
