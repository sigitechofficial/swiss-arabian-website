"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { useAddToCart } from "@/features/cart";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { PRODUCT_CARD_ZOOM, ProductCard } from "../../ui";
import { cx } from "../../ui/shared";
import { toSapilCardModel } from "./productCardModel";
import { SapilLocaleLink } from "./SapilLocaleLink";
import { SapilQuickView } from "./SapilQuickView";
import { SapilWishlistButton } from "./SapilWishlistButton";

export type CardImagePriority = "high" | "eager" | "lazy";

/** Grid columns: 4 → 3 (≤1100px) → 2 (≤900px), inside a 1440px wrap. */
export const SAPIL_CARD_SIZES = "(max-width: 900px) 50vw, (max-width: 1100px) 33vw, 340px";

export type SapilProductCardProps = {
  /** Any shared catalog product (`ProductSummary`, `CatalogProduct`, a merch-rail card …). */
  product: ProductSummary;
  /**
   * First visible row of a page: `"high"` for the likely LCP card, `"eager"`
   * for the rest of that row. Everything else stays `"lazy"` (default).
   */
  imagePriority?: CardImagePriority;
  /** `sizes` of the card image (default: the shop grid). */
  imageSizes?: string;
  /** Replace the two pill tags with these, in navy (note-search hits). */
  highlightTags?: string[];
  /** Show the wishlist heart (default true). */
  wishlist?: boolean;
  /** Show the quick-view button (default true). */
  quickView?: boolean;
  /** Heading element for the name (default h3). */
  headingLevel?: ElementType;
  className?: string;
};

/** Eye icon (quick view). */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * The Sapil product card for any page: the design-system `ProductCard` filled
 * from a shared catalog product.
 *
 * - tile: the API's `tileColor`, else the neutral sand tile
 * - −% badge from `compareAtPrice`; "Out of stock" pill when it can't be bought
 * - tags: kind (EDP / Extrait) + who it's for
 * - + button (phones, as v9) adds one to the bag through `useAddToCart` (the bag opens)
 * - wishlist heart (shared wishlist hooks; wrap a grid in `WishlistStatusScope`)
 *   and a quick-view dialog, both at the tile's top corner, shown on hover/focus
 *   on hover screens and always on touch screens
 */
export function SapilProductCard({
  product,
  imagePriority = "lazy",
  imageSizes = SAPIL_CARD_SIZES,
  highlightTags,
  wishlist = true,
  quickView = true,
  headingLevel,
  className,
}: SapilProductCardProps) {
  const t = useSapilCopy();
  const locale = useShopLocale();
  const model = useMemo(() => toSapilCardModel(product, t, locale), [product, t, locale]);
  const { addToCart } = useAddToCart();
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  // v9: the + button stays green for 1.4s after adding.
  useEffect(() => {
    if (!added) return;
    const id = window.setTimeout(() => setAdded(false), 1400);
    return () => window.clearTimeout(id);
  }, [added]);

  const buyable = !model.unavailable && !model.outOfStock;
  const add = buyable
    ? () => {
        setAdded(true);
        void addToCart({
          sku: product.sku,
          variantId: product.variantId,
          slug: product.slug,
          title: product.title,
          imageUrl: product.imageUrl,
          price: product.price,
          currency: product.currency,
          quantity: 1,
        });
      }
    : undefined;

  const image =
    model.image && !imageFailed ? (
      <MediaImage
        src={model.image}
        alt={t("product.imageAlt", { name: model.name })}
        fill
        sizes={imageSizes}
        loading={imagePriority === "lazy" ? "lazy" : "eager"}
        fetchPriority={imagePriority === "high" ? "high" : undefined}
        onError={() => setImageFailed(true)}
        className={PRODUCT_CARD_ZOOM[model.shape]}
      />
    ) : (
      <span aria-hidden="true" />
    );

  const actions =
    wishlist || quickView ? (
      <div className="flex flex-col gap-[8px] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:[transition:opacity_.25s] [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100 [@media(hover:hover)]:has-[[aria-pressed=true]]:opacity-100">
        {wishlist ? <SapilWishlistButton productId={product.id} name={model.name} /> : null}
        {quickView ? (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={t("product.quickViewOf", { name: model.name })}
            onClick={() => setQuickOpen(true)}
            className="grid place-items-center w-[40px] h-[40px] rounded-full bg-sapil-white text-sapil-accent [&_svg]:w-[20px] [&_svg]:h-[20px] [transition:background_.2s,color_.2s] hover:bg-sapil-ink hover:text-sapil-white max-749:hidden"
          >
            <EyeIcon />
          </button>
        ) : null}
      </div>
    ) : undefined;

  return (
    <>
      <ProductCard
        name={model.name}
        href={model.href}
        image={image}
        tile={model.tile}
        price={model.price}
        was={model.was}
        discountPercent={model.discountPercent || undefined}
        badge={model.outOfStock ? t("product.outOfStock") : undefined}
        tags={highlightTags?.length ? highlightTags.slice(0, 2) : model.tags}
        tagsHighlighted={Boolean(highlightTags?.length)}
        shape={model.shape}
        onAdd={add}
        added={added}
        quickLabel={t("product.shopNow")}
        viewLabel={t("product.viewProduct", { name: model.name })}
        addLabel={t("product.addToBagNamed", { name: model.name })}
        actions={actions}
        headingLevel={headingLevel}
        LinkComponent={SapilLocaleLink}
        className={cx(className)}
      />
      {quickView && quickOpen ? (
        <SapilQuickView
          product={product}
          model={model}
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          onAdd={add}
        />
      ) : null}
    </>
  );
}
