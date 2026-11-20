"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { usePathname } from "next/navigation";
import { TamaraWidget } from "@/features/checkout/components/TamaraWidget";
import { tamaraCountry, tamaraLang } from "@/features/checkout/utils/tamara";
import { localeFromPathname } from "@/lib/i18n/localePath";
import type { Translator } from "@/lib/i18n/messages";
import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { giftChoiceBackdrop, giftChoiceRoot } from "@/styles/cartChrome";
import { useInstalmentPlan, type CustomInstalmentProvider } from "../../hooks/useInstalmentPlan";
import { TabbyPromoSnippet } from "@/features/payments/tabby/TabbyPromoSnippet";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";
import {
  INSTALMENT_PROVIDER_NAMES,
  instalmentProviders,
  payInFour,
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

type Provider = CustomInstalmentProvider;

/** Our own block lists Tamara only; Tabby has its official snippet above it. */
const PROVIDERS: Record<Provider, { name: string; mark: string }> = {
  tamara: { name: INSTALMENT_PROVIDER_NAMES.tamara, mark: pdpPayMarkTamara },
};

/** Whether the market's checkout offers each provider now (ADR-005 phase E). */
function useLiveProviders() {
  return instalmentProviders(useSiteIntegrations().paymentPromos);
}

/** When each of the four payments is taken: today, then in 1, 2 and 3 months. */
const WHEN = [0, 1, 2, 3] as const;

/** "In 2 months" — the narrowest phones drop the "In" part so four labels still fit side by side. */
function whenParts(months: number, t: Translator): { prefix: string | null; rest: string } {
  if (months === 0) return { prefix: null, rest: t("pdp.pay.today") };
  return { prefix: t("pdp.pay.inPrefix"), rest: t("pdp.pay.months", { count: months }) };
}

function whenLabel(months: number, t: Translator): string {
  const { prefix, rest } = whenParts(months, t);
  return prefix ? `${prefix} ${rest}` : rest;
}

export { payInFour } from "../../utils/instalments";

/**
 * Tamara's official widget v2 replaces our Tamara button once the market's
 * checkout offers Tamara, a public key is set and the currency is one Tamara
 * covers (AED / SAR).
 */
export function usesTamaraWidget(
  currency: string,
  live: boolean,
  publicKey: string | null | undefined,
): boolean {
  return live && Boolean(publicKey) && tamaraCountry(currency) !== null;
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
  const t = useShopCopy();
  const { name, mark } = PROVIDERS[provider];
  const { live } = useLiveProviders()[provider];
  const titleId = useId();
  const closeRef = useDialogChrome(onClose);
  const payments = payInFour(price);

  return createPortal(
    <div className={giftChoiceRoot}>
      <button type="button" className={giftChoiceBackdrop} aria-label={t("promo.close")} onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={pdpPayDialog}>
        <button type="button" className={pdpPayClose} aria-label={t("promo.close")} onClick={onClose} ref={closeRef}>
          <X size={18} />
        </button>

        <span className={mark}>{name}</span>
        <p className={pdpPayTitle} id={titleId}>
          {t("pdp.pay.title")}
        </p>
        <p className={pdpPayLede}>
          <TextWithLinks
            text={t("pdp.pay.lede", { ...linkSlots(["amount"]), provider: name })}
            links={{ amount: <strong>{formatMoney(price, currency)}</strong> }}
          />
        </p>

        <ol className={pdpPayPlan} aria-label={t("pdp.pay.schedule")}>
          {payments.map((amount, index) => (
            <li className={pdpPayStep} key={WHEN[index]}>
              <PayRing quarters={index + 1} />
              <p className={pdpPayAmount}>{formatMoney(amount, currency)}</p>
              <p className={pdpPayWhen}>{whenLabel(WHEN[index] ?? index, t)}</p>
            </li>
          ))}
        </ol>

        <p className={pdpPayHeading}>{t("subs.club.howItWorks")}</p>
        <ol className={pdpPaySteps}>
          <li>{t("pdp.pay.step1")}</li>
          <li>{t("pdp.pay.step2", { provider: name })}</li>
          <li>{t("pdp.pay.step3", { provider: name })}</li>
          <li>{t("pdp.pay.step4")}</li>
        </ol>

        {live ? null : <p className={pdpPaySoon}>{t("pdp.pay.soon", { provider: name })}</p>}

        <p className={pdpPayNote}>
          {t("pdp.pay.note", { provider: name })}
        </p>

        <button type="button" className={pdpPayDone} onClick={onClose}>
          {t("pdp.pay.gotIt")}
        </button>
      </section>
    </div>,
    document.body,
  );
}

/**
 * Instalments under the price: Tabby's official snippet (only where this
 * market's checkout offers Tabby), then our pay-in-4 card for the other
 * providers the market offers (Tamara). Tamara shows its own widget v2 when it
 * can (see `usesTamaraWidget`), otherwise our schedule dialog.
 */
export function PdpInstalments({ price, currency }: { price: number; currency: string }) {
  return (
    <>
      <TabbyPromoSnippet amount={price} currency={currency} source="product" className="mb-3" />
      <CustomInstalments price={price} currency={currency} />
    </>
  );
}

function CustomInstalments({ price, currency }: { price: number; currency: string }) {
  const t = useShopCopy();
  const plan = useInstalmentPlan(price);
  const { open, close } = plan;
  const each = formatMoney(plan.each, currency);
  const locale = localeFromPathname(usePathname() || "/");
  const tamara = useSiteIntegrations().paymentPromos.tamara;
  const tamaraKey = tamara?.publicKey ?? "";
  const tamaraWidget = usesTamaraWidget(currency, Boolean(tamara), tamaraKey);

  // Only providers this market's checkout offers; no row when there are none.
  if (!plan.available) return null;

  return (
    <>
      <section className={pdpPay} aria-label={t("pdp.pay.section")}>
        <div className={pdpPayHead}>
          <div className={pdpPayTop}>
            <div className="min-w-0">
              <p className={pdpPayEyebrow}>{t("pdp.pay.eyebrow")}</p>
              <p className={pdpPayOffer}>
                <TextWithLinks
                  text={t("pdp.pay.offer", linkSlots(["amount"]))}
                  links={{ amount: <strong>{each}</strong> }}
                />
              </p>
            </div>
            <span className={pdpPayBadge}>{t("pdp.pay.zeroInterest")}</span>
          </div>
          <ol className={pdpPayTrack} aria-label={t("pdp.pay.schedule")}>
            {WHEN.map((months, index) => {
              const { prefix, rest } = whenParts(months, t);
              return (
                <li className={pdpPayTrackStep} data-now={index === 0} key={months}>
                  <PayRing quarters={index + 1} className={pdpPayTrackRing} />
                  {/* The narrowest phones drop "In" so four labels still fit side by side. */}
                  <span>
                    {prefix ? <span className="max-[380px]:hidden">{prefix} </span> : null}
                    {rest}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className={pdpPayFoot}>
          {plan.providers.map(({ id: provider }) => {
            const { name, mark } = PROVIDERS[provider];
            const button = (
              <button
                type="button"
                className={pdpPayBtn}
                aria-haspopup="dialog"
                key={provider}
                onClick={(event) => plan.openProvider(provider, event.currentTarget)}
              >
                <span className={mark}>{name}</span>
                <span className={pdpPayBtnMore}>
                  {t("pdp.pay.learnMore")}
                  {/* Visible text stays in the accessible name ("Tabby Learn more about paying with Tabby"). */}
                  <span className="sr-only"> {t("pdp.pay.learnMoreAbout", { provider: name })}</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </span>
              </button>
            );
            if (provider !== "tamara" || !tamaraWidget) return button;
            return (
              <TamaraWidget
                key={provider}
                amount={price}
                currency={currency}
                lang={tamaraLang(locale)}
                publicKey={tamaraKey}
                className="min-w-0 flex-1"
                fallback={button}
              />
            );
          })}
        </div>
      </section>
      {open ? <PayDialog provider={open} price={price} currency={currency} onClose={close} /> : null}
    </>
  );
}
