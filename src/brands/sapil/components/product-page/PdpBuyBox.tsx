"use client";

import { useState, type Ref } from "react";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { useProductPurchase, PURCHASE_MAX_QUANTITY } from "@/features/catalog/hooks/useProductPurchase";
import type { ProductCollectionRef } from "@/features/catalog/types/product";
import type { StorefrontPdpMetafields } from "@/features/catalog/types/pdpMetafields";
import type { StorefrontReviewSummary } from "@/features/catalog/types/pdpReviews";
import type { StorefrontShippingPromise } from "@/features/catalog/types/pdpShipping";
import type { MarketDelivery } from "@/features/markets/utils/marketMerchSettings";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import type { CartLine } from "@/stores/useCartStore";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { QuantityStepper, Stars } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx, tintStyle } from "../../ui/shared";
import { productGender } from "../product/productCardModel";
import { SapilLocaleLink } from "../product/SapilLocaleLink";
import { deliveryPerks } from "./deliveryPerks";
import { noteRows, noteTone } from "./notes";
import { PdpInstalments } from "./PdpInstalments";

export function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M5 8h14l-1.2 12.2H6.2Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

/**
 * v9 `.p-info`: kicker, name, rating, price, description, quantity + Add to
 * bag, pay in 4, notes pyramid, details and delivery notes. Buying runs on
 * the shared `useProductPurchase` (the bag line is edited once it's in the bag).
 */
export function PdpBuyBox({
  product,
  description,
  metafields,
  collection,
  reviewSummary,
  showReviewRating,
  shippingPromise,
  marketDelivery,
  cartLine,
  money,
  addRowRef,
  concentration,
}: {
  product: CatalogProduct;
  /** "edp" / "extrait" as the API sends it (none: no kind shown) */
  concentration?: string | null;
  description: string | null;
  metafields: StorefrontPdpMetafields | null | undefined;
  collection: ProductCollectionRef | null | undefined;
  reviewSummary: StorefrontReviewSummary | null | undefined;
  showReviewRating: boolean;
  shippingPromise: StorefrontShippingPromise | null;
  marketDelivery: MarketDelivery | null;
  cartLine: CartLine | undefined;
  money: (n: number) => string;
  /** the Add to bag row (the sticky bar shows once it scrolls away) */
  addRowRef?: Ref<HTMLDivElement>;
}) {
  const t = useSapilCopy();
  const purchase = useProductPurchase(product, cartLine);
  const [status, setStatus] = useState("");
  useResetOnChange(product.slug, () => setStatus(""));

  const gender = productGender(product);
  const forWho = gender === "her" ? t("product.forHer") : gender === "him" ? t("product.forHim") : gender ? t("product.forEveryone") : null;
  // Only the API's own value (the shared CatalogProduct may hold a guess from the title).
  const kind =
    concentration === "edp"
      ? t("product.kindEdpLong")
      : concentration === "extrait"
        ? t("product.kindExtraitLong")
        : null;
  const kicker = [forWho, kind].filter(Boolean).join(" · ");
  const rows = noteRows(metafields);
  const family = metafields?.fragrance_family_text?.trim();
  const size = metafields?.size?.trim();
  const perks = deliveryPerks(shippingPromise, marketDelivery);
  const layerLabel = { top: t("product.top"), heart: t("product.heart"), base: t("product.base") };
  const layerHint = { top: t("product.topHint"), heart: t("product.heartHint"), base: t("product.baseHint") };

  const add = () => {
    const result = purchase.add();
    setStatus(
      result.status === "full"
        ? t("product.fullLine", { count: result.maxQuantity })
        : result.quantity > 1
          ? t("product.addedManyToBag", { count: result.quantity, name: product.title })
          : t("product.addedToBag", { name: product.title }),
    );
  };

  return (
    <div>
      {kicker ? <p className="text-[15px] text-sapil-ink-2">{kicker}</p> : null}
      <h1
        id="product-name"
        className="font-sapil-sans font-[700] text-[clamp(36px,3.4vw,50px)] leading-[1.08] tracking-[-.035em] mt-[8px] mb-[14px]"
      >
        {product.title}
      </h1>
      {showReviewRating && reviewSummary ? (
        <div className="flex items-center gap-[10px] text-[15px]">
          <Stars rating={reviewSummary.averageRating} size={18} />
          <b>{reviewSummary.averageRating.toFixed(1)}</b>
          <a href="#reviews" className="underline underline-offset-[3px]">
            {t("product.reviewsCount", { count: reviewSummary.reviewCount })}
          </a>
        </div>
      ) : null}
      <div className="flex items-center flex-wrap gap-[14px] mt-[16px] mb-[14px]">
        <span className="text-[34px] font-[700] tracking-[-.02em] tabular-nums">
          {product.price == null ? t("product.unavailable") : money(product.price)}
        </span>
        {product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price ? (
          <s className="text-[20px] text-sapil-muted font-[500]">
            <span className="sr-only">{t("product.was")} </span>
            {money(product.compareAtPrice)}
          </s>
        ) : null}
      </div>
      {description ? <p className="text-[17px] leading-[1.6] text-sapil-ink-2 max-w-[56ch] whitespace-pre-line">{description}</p> : null}

      <div ref={addRowRef} data-sapil="buy-row" className={cx("flex gap-[12px] items-center", description && "mt-[24px]")}>
        {purchase.needsAlert ? (
          <button type="button" disabled className={cx(buttonClass("dark"), "flex-1 h-[58px] text-[17px] rounded-[18px] max-900:text-[15px]")}>
            {purchase.unavailable ? t("product.unavailable") : t("product.outOfStock")}
          </button>
        ) : (
          <>
            <QuantityStepper
              variant="big"
              value={purchase.displayQty}
              onChange={purchase.setDisplayQuantity}
              itemLabel={product.title}
              max={purchase.canIncrease ? PURCHASE_MAX_QUANTITY : purchase.displayQty}
            />
            <button
              type="button"
              onClick={add}
              className={cx(
                buttonClass("dark"),
                "flex-1 h-[58px] text-[17px] rounded-[18px] gap-[10px] !bg-sapil-accent [&_svg]:w-[20px] [&_svg]:h-[20px] max-900:text-[15px]",
              )}
            >
              <BagIcon />
              <span>{t("product.addToBag")}</span>
            </button>
          </>
        )}
      </div>
      <p role="status" className="text-[14px] text-sapil-ink-2 mt-[8px] empty:hidden">
        {status}
      </p>
      {product.price != null && product.price > 0 && !purchase.needsAlert ? (
        <PdpInstalments price={product.price} currency={product.currency || "AED"} money={money} />
      ) : null}

      {rows.length ? (
        <>
          <h2 className="font-sapil-sans font-[600] text-[16px] leading-normal mt-[22px] mb-[10px]">{t("product.fragranceNotes")}</h2>
          <dl data-sapil="pyramid" className="bg-sapil-white rounded-[24px] px-[20px] py-[6px]">
            {rows.map((row) => (
              <div
                key={row.layer}
                className="grid grid-cols-[120px_1fr] gap-[16px] items-center py-[14px] border-b border-sapil-line last:border-b-0 max-900:grid-cols-1 max-900:gap-[8px]"
              >
                <dt className="font-[600] text-[15px] leading-[1.2]">
                  {layerLabel[row.layer]}
                  <small className="block font-[400] text-[12px] text-sapil-muted mt-[2px]">{layerHint[row.layer]}</small>
                </dt>
                <dd className="flex flex-wrap gap-[8px]">
                  {row.notes.map((note) => {
                    const tone = noteTone(note);
                    return (
                      <span
                        key={note}
                        style={tintStyle("--nc", tone.color)}
                        className="h-[40px] ps-[10px] pe-[16px] rounded-full bg-[var(--nc)] inline-flex items-center gap-[8px] font-[600] text-[14px]"
                      >
                        <i aria-hidden="true" className="w-[24px] h-[24px] rounded-full bg-sapil-white grid place-items-center not-italic text-[12px] leading-[1] text-sapil-ink-2">
                          {tone.glyph}
                        </i>
                        {note}
                      </span>
                    );
                  })}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {size || collection || family ? (
        <dl className="my-[20px] bg-sapil-white rounded-[24px] px-[20px] py-[4px] shadow-[0_1px_2px_rgba(60,45,30,.05)]">
          {[
            size ? { k: t("product.specSize"), v: size } : null,
            collection
              ? {
                  k: t("product.specCollection"),
                  v: (
                    <SapilLocaleLink href={`/collections/${collection.slug}`} className="hover:text-sapil-accent">
                      {collection.name}
                    </SapilLocaleLink>
                  ),
                }
              : null,
            family ? { k: t("product.specFamily"), v: family } : null,
          ]
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map((r) => (
              <div
                key={String(r.k)}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-[16px] py-[16px] border-b border-sapil-line last:border-b-0 max-900:grid-cols-2"
              >
                <dt className="text-sapil-ink-2 text-[16px]">{r.k}</dt>
                <dd className="font-[600] text-[16px]">{r.v}</dd>
              </div>
            ))}
        </dl>
      ) : null}

      {perks.length ? (
        <ul className="list-none grid grid-cols-3 gap-[10px] mt-[16px] p-0 max-900:grid-cols-1">
          {perks.map((perk) => (
            <li
              key={perk.kind}
              className="flex items-center gap-[10px] bg-sapil-white rounded-[16px] p-[14px] text-[14px] leading-[1.3] text-sapil-ink-2 [&_svg]:w-[22px] [&_svg]:h-[22px] [&_svg]:flex-none [&_svg]:text-sapil-ok"
            >
              {perk.kind === "free" ? <TruckIcon /> : perk.kind === "days" ? <ClockIcon /> : <BagIcon />}
              <span>
                {perk.kind === "free"
                  ? t("product.perkFreeDelivery", { price: money(perk.threshold) })
                  : perk.kind === "days"
                    ? t("product.perkDeliveryDays", { days: perk.min === perk.max ? String(perk.min) : `${perk.min}–${perk.max}` })
                    : t("product.perkCod")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
