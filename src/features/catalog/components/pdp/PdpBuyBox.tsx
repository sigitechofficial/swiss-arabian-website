"use client";

import { useState } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { EarnPreviewNote } from "@/features/loyalty/components/EarnPreviewNote";
import { useProductEarnPreview } from "@/features/loyalty/hooks/useEarnPreview";
import { OfferCountLink, PdpOffersPanel } from "@/features/promotions/components/PromotionOffers";
import { stars } from "@/styles/landingChrome";
import {
  pdpChip,
  pdpChips,
  pdpDot,
  pdpFormat,
  pdpInstallments,
  pdpName,
  pdpPanel,
  pdpPromise,
  pdpPromises,
  pdpRating,
} from "@/styles/pdpChrome";
import type { CartLine } from "@/stores/useCartStore";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { noteDotColor } from "../../constants/productDetailContent";
import type { StorefrontPdpMetafields } from "../../types/pdpMetafields";
import type { StorefrontReviewSummary } from "../../types/pdpReviews";
import { familyChips } from "../../utils/pdpMetafields";
import { reviewStarsLabel } from "../../utils/pdpReviews";
import { PdpScentFamily } from "../PdpScentFamily";
import { PdpBuyBar } from "./PdpBuyBar";

type PdpBuyBoxProps = {
  product: CatalogProduct;
  formatLabel: string;
  description: string | null;
  reviewSummary: StorefrontReviewSummary | null | undefined;
  showReviewRating: boolean;
  metafields: StorefrontPdpMetafields | null | undefined;
  daysLine: string | null;
  thresholdLine: string | null;
  zoneCode: string;
  cartLine: CartLine | undefined;
  scentFallback: CatalogProduct[];
};

export function PdpBuyBox({
  product,
  formatLabel,
  description,
  reviewSummary,
  showReviewRating,
  metafields,
  daysLine,
  thresholdLine,
  zoneCode,
  cartLine,
  scentFallback,
}: PdpBuyBoxProps) {
  const [offersOpen, setOffersOpen] = useState(false);
  const earnPreview = useProductEarnPreview({
    unitPrice: product.price,
    quantity: cartLine?.quantity ?? 1,
  });

  const family = familyChips(metafields);
  const chips = family.length
    ? family
    : (product.subtitle ?? "")
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 3);
  const familyCode = family[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "") || null;

  return (
    <div className={pdpPanel}>
      <h1 className={pdpName} id="product-name">
        {product.title}
      </h1>
      <p className={pdpFormat}>{formatLabel}</p>
      {showReviewRating && reviewSummary ? (
        <a className={pdpRating} href="#pdp-reviews">
          <span className={`${stars} text-[0.78rem] tracking-[0.08em]`} aria-hidden="true">
            {reviewStarsLabel(reviewSummary.averageRating)}
          </span>
          <span>
            <strong>{reviewSummary.averageRating.toFixed(1)}</strong>
            {reviewSummary.verifiedPurchaseCount > 0
              ? " · Verified reviews"
              : ` · ${reviewSummary.reviewCount} ${reviewSummary.reviewCount === 1 ? "review" : "reviews"}`}
          </span>
        </a>
      ) : null}
      {description ? (
        <p className="m-0 line-clamp-3 max-w-[38rem] text-[0.9375rem] leading-normal text-[#6f6152]">
          {description}
        </p>
      ) : null}

      {chips.length ? (
        <ul className={pdpChips} role="list" aria-label="Featured notes">
          {chips.map((chip) => (
            <li className={pdpChip} key={chip}>
              <span className={pdpDot} aria-hidden="true" style={{ backgroundColor: noteDotColor(chip) }} />
              {chip}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="m-0 flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="m-0 text-[1.75rem] font-semibold tracking-[-0.01em] text-[#2a201a]">
          {formatMoney(product.price, product.currency)}
        </p>
        <OfferCountLink productId={product.id} onOpen={() => setOffersOpen(true)} />
      </div>
      {product.price != null ? (
        <p className={pdpInstallments}>
          or 4 interest-free payments of <strong>{formatMoney(product.price / 4, product.currency)}</strong> with
          Tabby or Tamara.
        </p>
      ) : null}

      <EarnPreviewNote preview={earnPreview.preview} />

      {daysLine || thresholdLine ? (
        <ul className={pdpPromises} role="list">
          {daysLine ? (
            <li className={pdpPromise}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2.5 13.5v-8h9v8zM11.5 8h3.2l2.8 3v2.5h-2" />
                <circle cx="6" cy="14.8" r="1.7" />
                <circle cx="14" cy="14.8" r="1.7" />
              </svg>
              <span>{daysLine}</span>
            </li>
          ) : null}
          {thresholdLine ? (
            <li className={pdpPromise}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M10 2.8 3.5 5.5v4.2c0 4 2.8 6.6 6.5 7.5 3.7-.9 6.5-3.5 6.5-7.5V5.5z" />
                <path d="M7.2 10l2 2 3.6-4" />
              </svg>
              <span>{thresholdLine}</span>
            </li>
          ) : null}
        </ul>
      ) : null}

      <PdpBuyBar product={product} cartLine={cartLine} />
      <PdpOffersPanel productId={product.id} open={offersOpen} onOpenChange={setOffersOpen} />
      <PdpScentFamily current={product} familyCode={familyCode} zoneCode={zoneCode} fallback={scentFallback} />
    </div>
  );
}
