"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { env } from "@/lib/config/env";
import { localeFromPathname, type ShopLocale } from "@/lib/i18n/localePath";
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

type Provider = "tamara" | "tabby";

const PROVIDERS: Record<Provider, { name: string; mark: string; live: boolean }> = {
  tamara: { name: "Tamara", mark: pdpPayMarkTamara, live: env.flags.tamara },
  tabby: { name: "Tabby", mark: pdpPayMarkTabby, live: env.flags.tabby },
};

const WHEN = ["Today", "In 1 month", "In 2 months", "In 3 months"] as const;

/** Four payments to the cent. The last one carries whatever rounding left over, so they add up to the price. */
export function payInFour(price: number): number[] {
  const cents = Math.round(price * 100);
  const each = Math.floor(cents / 4);
  return [each, each, each, cents - each * 3].map((value) => value / 100);
}

/** Currencies Tabby's own pop-up covers. Anywhere else the Tabby box keeps our dialog. */
const TABBY_CURRENCIES = new Set(["AED", "SAR", "KWD"]);

/**
 * Tabby's own "Learn more" page, the same one their snippet shows. Their docs ask custom boxes to open it
 * rather than a home-made dialog. The merchant keys are added once the account exists.
 */
export function tabbyPopupUrl(
  price: number,
  currency: string,
  locale: ShopLocale,
  keys: { publicKey: string; merchantCode: string } = env.tabby,
): string | null {
  const code = currency.toUpperCase();
  if (!TABBY_CURRENCIES.has(code)) return null;
  const host = code === "SAR" ? "https://checkout.tabby.sa" : "https://checkout.tabby.ai";
  const params = new URLSearchParams({ price: price.toFixed(code === "KWD" ? 3 : 2), currency: code });
  if (keys.merchantCode) params.set("merchant_code", keys.merchantCode);
  if (keys.publicKey) params.set("public_key", keys.publicKey);
  return `${host}/promos/product-page/installments/${locale}/?${params.toString()}`;
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

function TabbyDialog({ src, onClose }: { src: string; onClose: () => void }) {
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
        <h2 className={pdpPayTitle} id={titleId}>
          Pay in 4, interest-free
        </h2>
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

        <h3 className={pdpPayHeading}>How it works</h3>
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
  const [open, setOpen] = useState<Provider | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const locale = localeFromPathname(usePathname() || "/");
  const tabbyUrl = tabbyPopupUrl(price, currency, locale);
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
                aria-label={`Learn more about paying with ${name}`}
                key={provider}
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setOpen(provider);
                }}
              >
                <span className={mark}>{name}</span>
                <span className={pdpPayBtnMore}>
                  Learn more
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
