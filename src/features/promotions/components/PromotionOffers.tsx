"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { usePromotionDiscovery } from "../hooks/usePromotionDiscovery";
import type { DiscoveryChrome, DiscoveryOffer, PromotionDiscovery } from "../types/discovery";
import { badgeForProduct } from "../types/discovery";
import { trackPromotion } from "../utils/promotionAnalytics";

function Overlay({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(children, document.body);
}

function useDialog(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let removeKeys = () => {};
    const bind = () => {
      const root = ref.current;
      if (!root) {
        frame = requestAnimationFrame(bind);
        return;
      }
      const focusable = () =>
        [...root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )];
      focusable()[0]?.focus();
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCloseRef.current();
          return;
        }
        if (event.key !== "Tab") return;
        const items = focusable();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      window.addEventListener("keydown", onKey);
      removeKeys = () => window.removeEventListener("keydown", onKey);
    };
    bind();
    return () => {
      cancelAnimationFrame(frame);
      removeKeys();
    };
  }, [active]);
  return ref;
}

function OfferBody({
  offer,
  onDetails,
  surface,
  market,
  brand,
  chrome,
  prominent = false,
}: {
  offer: DiscoveryOffer;
  onDetails: (offer: DiscoveryOffer) => void;
  surface: string;
  market: string | null;
  brand: string | null;
  chrome: DiscoveryChrome;
  prominent?: boolean;
}) {
  return (
    <article className={prominent ? "grid gap-1.5 pt-3 [&_h3]:text-[1.2rem]" : "grid gap-1.5 border-t border-shop-ink/12 pt-3"}>
      <h3 className="m-0 font-medium">{offer.publicTitle}</h3>
      {offer.qualificationSummary ? <p>{offer.qualificationSummary}</p> : null}
      <div className="flex flex-wrap gap-2">
        {offer.detailsAvailable ? (
          <button
            className="cursor-pointer border border-current bg-transparent px-3 py-2 font-[inherit] text-inherit"
            type="button"
            onClick={() => {
              trackPromotion("promotion_details_opened", {
                campaignId: offer.campaignId,
                campaignCode: offer.campaignCode,
                mechanic: offer.mechanic,
                market,
                brand,
                surface,
              });
              onDetails(offer);
            }}
          >
            {chrome.viewDetails}
          </button>
        ) : null}
        {offer.shopOfferAvailable && offer.shopOfferPath ? (
          <LocaleLink
            className="border border-current px-3 py-2 text-inherit no-underline"
            href={offer.shopOfferPath}
            onClick={() =>
              trackPromotion("shop_offer_clicked", {
                campaignId: offer.campaignId,
                campaignCode: offer.campaignCode,
                mechanic: offer.mechanic,
                market,
                brand,
                surface,
              })
            }
          >
            {offer.details.ctaLabel || "Choose your pieces"}
          </LocaleLink>
        ) : null}
      </div>
    </article>
  );
}

function Details({
  offer,
  chrome,
  onClose,
}: {
  offer: DiscoveryOffer;
  chrome: DiscoveryChrome;
  onClose: () => void;
}) {
  const titleId = useId();
  const ref = useDialog(true, onClose);
  return (
    <div ref={ref} className="fixed z-[281] flex flex-col gap-4 overflow-auto bg-sand p-5 pb-7 text-shop-ink max-[720px]:inset-x-0 max-[720px]:bottom-0 max-[720px]:max-h-[85vh] max-[720px]:rounded-t-2xl min-[721px]:inset-y-0 min-[721px]:right-0 min-[721px]:w-[min(420px,100%)] [&_h3]:m-0 [&_h3]:font-medium" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="cursor-pointer self-end border-0 bg-transparent font-[inherit] text-inherit" type="button" onClick={onClose}>
        {chrome.close}
      </button>
      <h2 className="m-0 font-medium" id={titleId}>{offer.publicTitle}</h2>
      <section>
        <h3>{chrome.whatYouGet}</h3>
        <p>{offer.details.whatYouGet || offer.benefitSummary}</p>
      </section>
      <section>
        <h3>{chrome.howToQualify}</h3>
        <p>{offer.details.howToQualify || offer.qualificationSummary}</p>
      </section>
      {offer.details.restrictions.length ? (
        <section>
          <h3>{chrome.restrictions}</h3>
          <ul>
            {offer.details.restrictions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {offer.shopOfferAvailable && offer.shopOfferPath ? (
        <div className="flex flex-wrap gap-2">
          <LocaleLink className="border border-current px-3 py-2 text-inherit no-underline" href={offer.shopOfferPath}>{offer.details.ctaLabel || "Choose your pieces"}</LocaleLink>
        </div>
      ) : null}
    </div>
  );
}

export function PromotionOfferHub({
  discovery,
  surface,
}: {
  discovery: PromotionDiscovery;
  surface: string;
}) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<DiscoveryOffer | null>(null);
  const [showAll, setShowAll] = useState(false);
  const titleId = useId();
  const seen = useRef(false);
  const closeHub = () => {
    setDetails(null);
    setShowAll(false);
    setOpen(false);
  };
  const secondary = showAll ? discovery.secondaryOffers : discovery.secondaryOffers.slice(0, 3);
  const hiddenOffers = discovery.secondaryOffers.length - secondary.length;
  const hubRef = useDialog(open && !details, closeHub);

  useEffect(() => {
    if (seen.current || !discovery.offers.length) return;
    seen.current = true;
    for (const offer of discovery.offers) {
      trackPromotion("promotion_impression", {
        campaignId: offer.campaignId,
        campaignCode: offer.campaignCode,
        mechanic: offer.mechanic,
        market: discovery.marketCode,
        brand: discovery.brandCode,
        surface,
      });
    }
  }, [discovery, surface]);

  if (!discovery.entryLabel || discovery.offers.length === 0) return null;

  return (
    <>
      <button className="mb-3 flex w-full cursor-pointer border border-current bg-transparent px-3 py-2.5 text-start font-[inherit] text-inherit" type="button" onClick={() => setOpen(true)}>
        {discovery.entryLabel}
      </button>
      {open ? (
        <Overlay>
          <button className="fixed inset-0 z-[280] border-0 bg-[rgba(20,16,12,0.45)]" type="button" aria-label="Close" onClick={() => setOpen(false)} />
          <div ref={hubRef} className="fixed z-[281] flex flex-col gap-4 overflow-auto bg-sand p-5 pb-7 text-shop-ink max-[720px]:inset-x-0 max-[720px]:bottom-0 max-[720px]:max-h-[85vh] max-[720px]:rounded-t-2xl min-[721px]:inset-y-0 min-[721px]:right-0 min-[721px]:w-[min(420px,100%)]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button className="cursor-pointer self-end border-0 bg-transparent font-[inherit] text-inherit" type="button" onClick={() => setOpen(false)}>
              {discovery.chrome.close}
            </button>
            <h2 className="m-0 font-medium" id={titleId}>{discovery.entryLabel}</h2>
            {discovery.unlockedBenefits.map((item) => (
              <p className="m-0" key={`${item.campaignCode}-${item.message}`}>
                {item.message}
              </p>
            ))}
            {discovery.primaryOffer ? (
              <OfferBody
                prominent
                offer={discovery.primaryOffer}
                surface={surface}
                market={discovery.marketCode}
                brand={discovery.brandCode}
                chrome={discovery.chrome}
                onDetails={(offer) => {
                  setOpen(false);
                  setDetails(offer);
                }}
              />
            ) : null}
            {secondary.map((offer) => (
              <OfferBody
                key={offer.campaignCode}
                offer={offer}
                surface={surface}
                market={discovery.marketCode}
                brand={discovery.brandCode}
                chrome={discovery.chrome}
                onDetails={(next) => {
                  setOpen(false);
                  setDetails(next);
                }}
              />
            ))}
            {hiddenOffers > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button className="cursor-pointer border border-current bg-transparent px-3 py-2 font-[inherit] text-inherit" type="button" onClick={() => setShowAll(true)}>
                  {discovery.locale.toLowerCase().startsWith("ar")
                    ? `${discovery.chrome.viewAll} (${discovery.offers.length})`
                    : `View all ${discovery.offers.length} benefits`}
                </button>
              </div>
            ) : null}
          </div>
        </Overlay>
      ) : null}
      {details ? (
        <Overlay>
          <button className="fixed inset-0 z-[280] border-0 bg-[rgba(20,16,12,0.45)]" type="button" aria-label="Close details" onClick={() => setDetails(null)} />
          <Details offer={details} chrome={discovery.chrome} onClose={() => setDetails(null)} />
        </Overlay>
      ) : null}
    </>
  );
}

const OFFER_FILLER = new Set(["a", "an", "and", "each", "for", "from", "of", "on", "the", "to", "with", "your"]);

function offerWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff%]+/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !OFFER_FILLER.has(word));
}

function sameOfferLine(left: string, right: string) {
  const a = left.trim();
  const b = right.trim();
  if (!a || !b) return false;
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const leftWords = offerWords(a);
  const rightWords = new Set(offerWords(b));
  if (!leftWords.length || rightWords.size === 0) return false;
  const shared = leftWords.filter((word) => rightWords.has(word)).length;
  return shared / Math.min(leftWords.length, rightWords.size) >= 0.66;
}

function offerCardCopy(offer: DiscoveryOffer) {
  const headline = (offer.badge || offer.publicTitle).trim();
  const short = offer.shortMessage.trim();
  const title = offer.publicTitle.trim();
  const support =
    short && !sameOfferLine(short, headline)
      ? short
      : !short && title && !sameOfferLine(title, headline)
        ? title
        : "";
  return { headline, support };
}

function offerDetailLines(offer: DiscoveryOffer, shown: string[]) {
  const candidates = [
    offer.shortMessage,
    offer.details.whatYouGet || offer.benefitSummary,
    offer.details.howToQualify || offer.qualificationSummary,
    ...offer.details.restrictions,
  ];
  const lines: string[] = [];
  for (const line of candidates) {
    const text = line.trim();
    if (!text) continue;
    if ([...shown, ...lines].some((existing) => sameOfferLine(text, existing))) continue;
    lines.push(text);
  }
  return lines;
}

function OfferMark({ mechanic }: { mechanic: string }) {
  const common = { viewBox: "0 0 20 20", fill: "none", "aria-hidden": true as const, className: "size-5" };
  if (mechanic === "SET_BUNDLE" || mechanic === "BUNDLE") {
    return (
      <svg {...common}>
        <rect x="3" y="8" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="3" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (mechanic === "GWP") {
    return (
      <svg {...common}>
        <rect x="3.5" y="8" width="13" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 11.2h13M10 8v8.5M10 8c0-2.2-1.4-3.5-2.8-3.5S5.2 6 6.6 7.4C7.6 8.4 10 8 10 8Zm0 0c0-2.2 1.4-3.5 2.8-3.5S14.8 6 13.4 7.4C12.4 8.4 10 8 10 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (mechanic === "FREE_SHIPPING" || mechanic === "SHIPPING_DISCOUNT") {
    return (
      <svg {...common}>
        <path d="M2.5 13.2V6.2h8.2v7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.7 8.2h3.1l2.7 2.6v2.4h-1.6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="14.2" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13.4" cy="14.2" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (mechanic === "TIERED_SPEND") {
    return (
      <svg {...common}>
        <path d="M4 14.5V10M8.5 14.5V7M13 14.5V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (mechanic === "BUY_X_GET_Y") {
    return (
      <svg {...common}>
        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (mechanic === "ORDER_DISCOUNT" || mechanic === "PRODUCT_DISCOUNT") {
    return (
      <svg {...common}>
        <circle cx="6.2" cy="6.2" r="1.3" fill="currentColor" />
        <circle cx="13.8" cy="13.8" r="1.3" fill="currentColor" />
        <path d="M14.5 5.5 5.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 6.5 10 3.5l6 3v7l-6 3-6-3v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 10.2V16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PdpOffersPanel({
  productId,
  open: openProp,
  onOpenChange,
}: {
  productId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const query = usePromotionDiscovery(productId ? [productId] : []);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setUncontrolledOpen(next);
  };
  const titleId = useId();
  const close = () => {
    setActiveCode(null);
    setOpen(false);
  };
  const dialogRef = useDialog(open, close);
  const discovery = query.data;
  const offers = discovery?.offers ?? [];

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  if (!discovery || offers.length === 0) return null;
  const arabic = discovery.locale.toLowerCase().startsWith("ar");
  const title = arabic ? "مزايا لك" : "Offers for you";
  const countLabel = arabic
    ? `${offers.length} متاحة`
    : `${offers.length} ${offers.length === 1 ? "offer" : "offers"}`;

  return (
    <section className="m-0" id="pdp-offers">
      <button
        className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-4 rounded-lg border-0 bg-copper px-4 py-3 text-[0.95rem]! font-semibold! text-white!"
        type="button"
        aria-expanded={open}
        aria-controls="pdp-offers-dialog"
        onClick={() => setOpen(true)}
      >
        <span>{title}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold [&_svg]:h-3.5 [&_svg]:w-3.5">
          {countLabel}
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open ? (
        <Overlay>
          <button
            className="fixed inset-0 z-[1400] cursor-pointer border-0 bg-[rgba(24,20,17,0.46)] backdrop-blur-[6px]"
            type="button"
            aria-label={arabic ? "إغلاق" : "Close"}
            onClick={close}
          />
          <div className="pointer-events-none fixed inset-0 z-[1401] grid place-items-center p-4 sm:p-6">
            <div
              ref={dialogRef}
              id="pdp-offers-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="pointer-events-auto flex max-h-[min(84vh,720px)] w-[min(720px,100%)] flex-col overflow-hidden rounded-[22px] bg-[#faf6ee] text-[#1a1512] shadow-[0_28px_70px_rgba(24,20,17,0.28)]"
            >
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
                <div>
                  <p className="m-0 text-[0.68rem] font-bold tracking-[0.16em] text-copper uppercase">{countLabel}</p>
                  <h2 id={titleId} className="m-0 mt-1 font-[family-name:var(--font-display)] text-[1.55rem] leading-none font-medium">
                    {title}
                  </h2>
                </div>
                <button
                  className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-inherit hover:bg-[rgb(26_21_18/0.06)]"
                  type="button"
                  aria-label={arabic ? "إغلاق" : "Close"}
                  onClick={close}
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5">
                    <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
              </div>
              <ul className={`m-0 grid min-h-0 flex-1 auto-rows-max list-none items-start gap-2.5 overflow-y-auto px-5 pt-1 pb-5 sm:px-6 sm:pb-6 ${offers.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {offers.map((offer) => {
                  const expanded = activeCode === offer.campaignCode;
                  const copy = offerCardCopy(offer);
                  const details = offerDetailLines(offer, [copy.headline, copy.support]);
                  const canShop = Boolean(offer.shopOfferAvailable && offer.shopOfferPath);
                  const canExpand = details.length > 0 || canShop;
                  return (
                    <li
                      className={`min-h-min overflow-hidden rounded-2xl border bg-white ${expanded ? "border-copper/35" : "border-[#241f1b]/10"}`}
                      key={offer.campaignCode}
                    >
                      {canExpand ? (
                        <button
                          className="group flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-3.5 py-3 text-start text-inherit"
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setActiveCode(expanded ? null : offer.campaignCode)}
                        >
                          <OfferFace offer={offer} copy={copy} expanded={expanded} disclosure />
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 px-3.5 py-3">
                          <OfferFace offer={offer} copy={copy} expanded={false} disclosure={false} />
                        </div>
                      )}
                      {expanded ? (
                        <div className="border-t border-[#241f1b]/8 px-3.5 pt-3 pb-3.5">
                          {details.length ? (
                            <div className="grid gap-1.5">
                              {details.map((line) => (
                                <p className="m-0 text-[0.84rem] leading-snug text-[#241f1b]/75" key={line}>
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {canShop ? (
                            <LocaleLink
                              className="mt-3 inline-flex rounded-full bg-copper px-3.5 py-2 text-[0.78rem] font-semibold tracking-[0.04em] text-white! no-underline hover:bg-copper-deep"
                              href={offer.shopOfferPath as string}
                              onClick={close}
                            >
                              {offer.details.ctaLabel || (arabic ? "اختَر القطع" : "Choose your pieces")}
                            </LocaleLink>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Overlay>
      ) : null}
    </section>
  );
}

function OfferFace({
  offer,
  copy,
  expanded,
  disclosure,
}: {
  offer: DiscoveryOffer;
  copy: { headline: string; support: string };
  expanded: boolean;
  disclosure: boolean;
}) {
  return (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${expanded ? "bg-copper text-white" : "bg-[rgb(140_68_53/0.1)] text-copper"}`}>
        <OfferMark mechanic={offer.mechanic} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.92rem] leading-snug font-semibold text-[#1a1512]">{copy.headline}</span>
        {copy.support ? (
          <span className="mt-0.5 block text-[0.8rem] leading-snug text-[#241f1b]/62">{copy.support}</span>
        ) : null}
      </span>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`size-4 shrink-0 text-[#241f1b]/40 transition-transform ${expanded ? "rotate-180" : ""} ${disclosure ? "" : "invisible"}`}>
        <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </>
  );
}

export function PromotionOffersEntry({
  productId,
  surface = "pdp",
}: {
  productId?: string | null;
  surface?: string;
}) {
  const query = usePromotionDiscovery(productId ? [productId] : []);
  if (!query.data) return null;
  return <PromotionOfferHub discovery={query.data} surface={surface} />;
}

export function PromotionCardBadge({ productId }: { productId?: string | null }) {
  const query = usePromotionDiscovery(productId ? [productId] : []);
  const badge = badgeForProduct(query.data, productId);
  if (!badge) return null;
  return <p className="mb-1.5 text-xs tracking-[0.04em] uppercase">{badge.badge}</p>;
}

export function PromotionCampaignTile({ offer }: { offer: DiscoveryOffer }) {
  const copy = (
    <>
      {offer.badge ? <span>{offer.badge}</span> : null}
      <strong>{offer.publicTitle}</strong>
      {offer.lines.length > 1 ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {offer.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : offer.lines.length === 1 ? (
        <p>{offer.lines[0]}</p>
      ) : offer.shortMessage ? (
        <p>{offer.shortMessage}</p>
      ) : null}
    </>
  );
  if (!offer.shopOfferPath) {
    return <article className="flex min-h-full flex-col justify-end gap-2 border border-current bg-warm p-5 text-inherit [&_span]:text-[0.8rem] [&_span]:tracking-[0.06em] [&_span]:uppercase">{copy}</article>;
  }
  return (
    <LocaleLink className="flex min-h-full flex-col justify-end gap-2 border border-current bg-warm p-5 text-inherit no-underline [&_span]:text-[0.8rem] [&_span]:tracking-[0.06em] [&_span]:uppercase" href={offer.shopOfferPath}>
      {copy}
    </LocaleLink>
  );
}
