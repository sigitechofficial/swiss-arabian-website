"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./promotionDiscovery.module.css";
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
    <article className={prominent ? `${styles.offer} ${styles.offerPrimary}` : styles.offer}>
      <h3>{offer.publicTitle}</h3>
      {offer.qualificationSummary ? <p>{offer.qualificationSummary}</p> : null}
      <div className={styles.actions}>
        {offer.detailsAvailable ? (
          <button
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
    <div ref={ref} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className={styles.close} type="button" onClick={onClose}>
        {chrome.close}
      </button>
      <h2 id={titleId}>{offer.publicTitle}</h2>
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
        <div className={styles.actions}>
          <Link href={offer.shopOfferPath}>{offer.details.ctaLabel || "Choose your pieces"}</Link>
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
      <button className={styles.entry} type="button" onClick={() => setOpen(true)}>
        {discovery.entryLabel}
      </button>
      {open ? (
        <Overlay>
          <button className={styles.backdrop} type="button" aria-label="Close" onClick={() => setOpen(false)} />
          <div ref={hubRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button className={styles.close} type="button" onClick={() => setOpen(false)}>
              {discovery.chrome.close}
            </button>
            <h2 id={titleId}>{discovery.entryLabel}</h2>
            {discovery.unlockedBenefits.map((item) => (
              <p className={styles.unlocked} key={`${item.campaignCode}-${item.message}`}>
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
              <div className={styles.actions}>
                <button type="button" onClick={() => setShowAll(true)}>
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
          <button className={styles.backdrop} type="button" aria-label="Close details" onClick={() => setDetails(null)} />
          <Details offer={details} chrome={discovery.chrome} onClose={() => setDetails(null)} />
        </Overlay>
      ) : null}
    </>
  );
}

export function PdpOffersPanel({ productId }: { productId?: string | null }) {
  const query = usePromotionDiscovery(productId ? [productId] : []);
  const [open, setOpen] = useState(false);
  const discovery = query.data;
  const offers = discovery?.offers ?? [];
  if (!discovery || offers.length === 0) return null;
  const arabic = discovery.locale.toLowerCase().startsWith("ar");
  const countLabel = arabic
    ? `${offers.length} متاحة`
    : `${offers.length} available`;

  return (
    <section className="pdp-offers" id="pdp-offers">
      <button
        className="pdp-offers__bar"
        type="button"
        aria-expanded={open}
        aria-controls="pdp-offers-list"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{arabic ? "مزايا لك" : "Offers for you"}</span>
        <span className="pdp-offers__count">
          {countLabel}
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open ? (
        <ul className="pdp-offers__list" id="pdp-offers-list">
          {offers.map((offer) => (
            <li key={offer.campaignCode}>
              {offer.badge ? <p className="pdp-offers__kicker">{offer.badge}</p> : null}
              <h3>{offer.publicTitle}</h3>
              {offer.shortMessage ? <p>{offer.shortMessage}</p> : null}
              {offer.qualificationSummary && offer.qualificationSummary !== offer.shortMessage ? (
                <p>{offer.qualificationSummary}</p>
              ) : null}
              {offer.shopOfferAvailable && offer.shopOfferPath ? (
                <Link href={offer.shopOfferPath}>{offer.details.ctaLabel || "Choose your pieces"}</Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function OfferCountLink({ productId }: { productId?: string | null }) {
  const query = usePromotionDiscovery(productId ? [productId] : []);
  const count = query.data?.offers.length ?? 0;
  if (count === 0) return null;
  const arabic = query.data?.locale.toLowerCase().startsWith("ar");
  return (
    <a className="pdp-hero__offer-count" href="#pdp-offers">
      {arabic ? `${count} مزايا` : `${count} ${count === 1 ? "offer" : "offers"}`}
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
  return <p className={styles.badge}>{badge.badge}</p>;
}

export function PromotionCampaignTile({ offer }: { offer: DiscoveryOffer }) {
  const copy = (
    <>
      {offer.badge ? <span>{offer.badge}</span> : null}
      <strong>{offer.publicTitle}</strong>
      {offer.lines.length > 1 ? (
        <ul className={styles.tileLines}>
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
    return <article className={styles.tile}>{copy}</article>;
  }
  return (
    <Link className={styles.tile} href={offer.shopOfferPath}>
      {copy}
    </Link>
  );
}
