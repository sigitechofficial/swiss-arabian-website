"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SideSheet } from "@/components/ui/SideSheet";
import { drawerBody, drawerClose, drawerHead, drawerPanel } from "@/styles/cartChrome";
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
          <Link
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
          </Link>
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
          <Link className="border border-current px-3 py-2 text-inherit no-underline" href={offer.shopOfferPath}>{offer.details.ctaLabel || "Choose your pieces"}</Link>
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
  const discovery = query.data;
  const offers = discovery?.offers ?? [];
  if (!discovery || offers.length === 0) return null;
  const arabic = discovery.locale.toLowerCase().startsWith("ar");
  const title = arabic ? "مزايا لك" : "Offers for you";
  const countLabel = arabic
    ? `${offers.length} متاحة`
    : `${offers.length} available`;

  return (
    <section className="m-0" id="pdp-offers">
      <button
        className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-4 rounded-lg border-0 bg-copper px-4 py-3 text-[0.95rem]! font-semibold! text-white!"
        type="button"
        aria-expanded={open}
        aria-controls="pdp-offers-drawer"
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
      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        className="w-full bg-transparent shadow-[-12px_0_48px_rgba(0,0,0,0.12)] sm:w-[420px]"
      >
        <div className={drawerPanel} id="pdp-offers-drawer">
          <div className={drawerHead}>
            <h2 id={titleId}>{title}</h2>
            <button className={drawerClose} type="button" aria-label={arabic ? "إغلاق" : "Close"} onClick={() => setOpen(false)}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
          <div className={drawerBody}>
            <ul className="m-0 flex list-none flex-col gap-2.5 px-[22px] py-3">
              {offers.map((offer) => {
                const expanded = activeCode === offer.campaignCode;
                const whatYouGet = offer.details.whatYouGet || offer.benefitSummary;
                const howToQualify = offer.details.howToQualify || offer.qualificationSummary;
                const showWhat = Boolean(whatYouGet) && whatYouGet !== offer.shortMessage;
                const showHow = Boolean(howToQualify) && howToQualify !== offer.shortMessage && howToQualify !== whatYouGet;
                return (
                  <li className="overflow-hidden rounded-xl border border-[#241f1b]/10 bg-white" key={offer.campaignCode}>
                    <button
                      className="group flex w-full cursor-pointer items-start gap-3 border-0 bg-transparent px-3 py-3 text-start text-inherit aria-expanded:bg-[#faf6ee]"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setActiveCode(expanded ? null : offer.campaignCode)}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[rgb(140_68_53/0.1)] text-copper group-aria-expanded:bg-copper group-aria-expanded:text-white">
                        <OfferMark mechanic={offer.mechanic} />
                      </span>
                      <span className="min-w-0 flex-1">
                        {offer.badge ? <span className="block text-[0.68rem] font-bold tracking-[0.08em] text-copper uppercase">{offer.badge}</span> : null}
                        <span className="mt-0.5 block text-[0.95rem] font-semibold text-[#1a1512]">{offer.publicTitle}</span>
                        {offer.shortMessage && !expanded ? <span className="mt-1 block text-[0.82rem] leading-snug text-[#241f1b]/70">{offer.shortMessage}</span> : null}
                      </span>
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`mt-2 size-4 shrink-0 text-[#241f1b]/50 transition-transform ${expanded ? "rotate-180" : ""}`}>
                        <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                    {expanded ? (
                      <div className="border-t border-[#241f1b]/8 px-3 pt-3 pb-3.5">
                        {offer.shortMessage ? <p className="m-0 text-[0.85rem] leading-snug text-[#241f1b]/80">{offer.shortMessage}</p> : null}
                        {showWhat ? (
                          <p className="mt-2 mb-0 text-[0.85rem] leading-snug text-[#241f1b]/80">
                            <span className="font-semibold text-[#1a1512]">{discovery.chrome.whatYouGet}. </span>
                            {whatYouGet}
                          </p>
                        ) : null}
                        {showHow ? (
                          <p className="mt-2 mb-0 text-[0.85rem] leading-snug text-[#241f1b]/80">
                            <span className="font-semibold text-[#1a1512]">{discovery.chrome.howToQualify}. </span>
                            {howToQualify}
                          </p>
                        ) : null}
                        {offer.details.restrictions.length ? (
                          <ul className="mt-2 mb-0 list-disc ps-4 text-[0.82rem] text-[#241f1b]/70">
                            {offer.details.restrictions.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        ) : null}
                        {offer.shopOfferAvailable && offer.shopOfferPath ? (
                          <Link
                            className="mt-3 inline-flex rounded-full bg-copper px-3.5 py-2 text-[0.78rem] font-semibold tracking-[0.04em] text-white! no-underline hover:bg-copper-deep"
                            href={offer.shopOfferPath}
                            onClick={() => setOpen(false)}
                          >
                            {offer.details.ctaLabel || "Choose your pieces"}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </SideSheet>
    </section>
  );
}

export function OfferCountLink({
  productId,
  onOpen,
}: {
  productId?: string | null;
  onOpen?: () => void;
}) {
  const query = usePromotionDiscovery(productId ? [productId] : []);
  const count = query.data?.offers.length ?? 0;
  if (count === 0) return null;
  const arabic = query.data?.locale.toLowerCase().startsWith("ar");
  const label = arabic ? `${count} مزايا` : `${count} ${count === 1 ? "offer" : "offers"}`;
  if (onOpen) {
    return (
      <button className="inline-flex cursor-pointer items-center rounded-full border-0 bg-copper px-[0.7rem] py-[0.3rem] text-xs font-semibold! tracking-[0.02em] text-white!" type="button" onClick={onOpen}>
        {label}
      </button>
    );
  }
  return (
    <a className="inline-flex items-center rounded-full bg-copper px-[0.7rem] py-[0.3rem] text-xs font-semibold tracking-[0.02em] text-white no-underline" href="#pdp-offers">
      {label}
    </a>
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
    <Link className="flex min-h-full flex-col justify-end gap-2 border border-current bg-warm p-5 text-inherit no-underline [&_span]:text-[0.8rem] [&_span]:tracking-[0.06em] [&_span]:uppercase" href={offer.shopOfferPath}>
      {copy}
    </Link>
  );
}
