"use client";

import { useEffect, useMemo, useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { MERCH_RAIL_SLUGS } from "@/features/merchandising";
import { ProductCompanions } from "@/features/promotions/components/ProductCompanions";
import { RecentlyViewed } from "@/features/promotions/components/RecentlyViewed";
import { pageContainer } from "@/styles/siteChrome";
import { crumbsList } from "@/styles/shopChrome";
import { pdpHero, pdpSplit, relatedEm } from "@/styles/pdpChrome";
import { useProductDetailPage } from "../hooks/useProductDetailPage";
import type { ProductDetail } from "../types/product";
import { CONCENTRATION_LABELS } from "../constants/catalogProducts";
import type { ProductDetailContent } from "../constants/productDetailContent";
import { notesSectionTitle } from "../utils/pdpMetafields";
import { PdpReviews } from "./PdpReviews";
import { PdpBuyBox } from "./pdp/PdpBuyBox";
import { PdpComposition } from "./pdp/PdpComposition";
import { PdpGallery } from "./pdp/PdpGallery";
import { PdpPrVideo } from "./pdp/PdpPrVideo";
import { PdpRelatedRail } from "./pdp/PdpRelatedRail";

const EMPTY_CONTENT: ProductDetailContent = {
  story: "",
  notes: [],
  wear: "",
  shipping: "",
  authenticity: "",
};

export function ProductDetailPageView({
  product: serverDetail,
  serverZoneCode = null,
  slug: routeSlug,
  share = null,
}: {
  product: ProductDetail | null;
  /** Market the server rendered `product` for (the storefront's default market). */
  serverZoneCode?: string | null;
  slug: string;
  /** Canonical product address (absolute) and share image, from the server. */
  share?: { url: string; image?: string | null } | null;
}) {
  const copy = useShopCopy();
  const page = useProductDetailPage({ product: serverDetail, serverZoneCode, slug: routeSlug });
  const {
    detail: apiProduct,
    product,
    slug,
    zoneCode,
    metafields,
    livePyramid,
    pdpReviews,
    reviewSummary,
    showReviewRating,
    daysLine,
    thresholdLine,
    liveShippingCopy,
    cartLine,
    galleryImages,
    prVideo,
    description,
    markImageFailed: markFailed,
    moreFromCollection,
    related,
    youMayAlsoLike,
    clientStillLoading,
    loadFailed,
  } = page;

  const content = useMemo<ProductDetailContent>(() => {
    const story = apiProduct?.description?.trim() || "";
    return { ...EMPTY_CONTENT, story, shipping: liveShippingCopy ?? "" };
  }, [apiProduct, liveShippingCopy]);

  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, [slug]);

  const moreFromHeading = moreFromCollection?.name.replace(/\.$/, "") ?? "";

  // Related cards preload their own hover art (card-sized, when idle, and
  // only on hover-capable screens) via `useLoadedImages`.

  if (!product) {
    if (clientStillLoading) {
      return (
        <div>
          <section className={`${pageContainer} py-[clamp(3.5rem,8vw,7rem)]`} aria-busy="true" />
        </div>
      );
    }
    // A product that does not exist answers 404 on the server. Getting here
    // after a failed request means the store could not be reached: say so.
    if (loadFailed) {
      return (
        <div>
          <section className={`${pageContainer} py-[clamp(3.5rem,8vw,7rem)]`} role="alert">
            <h1 className="font-display text-[2rem] leading-[1.05] font-medium tracking-[0.005em]">
              {copy("productLoadFailed")}
            </h1>
            <p className="mt-4">
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={page.retry}
              >
                {copy("tryAgain")}
              </button>
            </p>
          </section>
        </div>
      );
    }
    return (
      <div>
        <section className={`${pageContainer} py-[clamp(3.5rem,8vw,7rem)]`}>
          <h1 className="font-display text-[2rem] leading-[1.05] font-medium tracking-[0.005em]">
            {copy("productMissing")}
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-[1.7] text-[var(--ink-2,#5b5148)]">
            <LocaleLink href="/products">{copy("backToProducts")}</LocaleLink>
          </p>
        </section>
      </div>
    );
  }

  const formatLabel =
    metafields?.size?.trim() ||
    (product.concentration ? CONCENTRATION_LABELS[product.concentration] : "");
  const notesHeading = notesSectionTitle(metafields);
  const notesRows = livePyramid;

  return (
    <div>
      <section className={pdpHero} aria-labelledby="product-name" data-reveal={reveal ? "play" : undefined}>
        <div className={pageContainer}>
          <nav className="pt-3 pb-4" aria-label="Breadcrumb">
            <ol className={crumbsList} role="list">
              <li>
                <LocaleLink href="/">Home</LocaleLink>
              </li>
              {moreFromCollection ? (
                <li>
                  <LocaleLink href={`/collections/${moreFromCollection.slug}`}>{moreFromCollection.name}</LocaleLink>
                </li>
              ) : null}
              <li aria-current="page">{product.title}</li>
            </ol>
          </nav>
          <div className={pdpSplit}>
            <PdpGallery
              images={galleryImages}
              title={product.title}
              resetKey={slug}
              outOfStock={product.price != null && (product.isSellable === false || product.inStock === false)}
              onImageError={markFailed}
            />
            <PdpBuyBox
              product={product}
              formatLabel={formatLabel}
              description={description}
              reviewSummary={reviewSummary}
              showReviewRating={showReviewRating}
              metafields={metafields}
              daysLine={daysLine}
              thresholdLine={thresholdLine}
              zoneCode={zoneCode}
              cartLine={cartLine}
              scentFallback={related}
              share={share}
            />
          </div>
        </div>
      </section>

      <PdpComposition
        product={product}
        content={content}
        metafields={metafields}
        formatLabel={formatLabel}
        notesHeading={notesHeading}
        notesRows={notesRows}
        notesBlurb={metafields?.fragrance_notes?.trim()}
        showNotes={livePyramid.length > 0}
        showLongevityBars={false}
        shippingCopy={liveShippingCopy ?? ""}
        resetKey={slug}
      />

      <PdpReviews
        // A new product starts the reviews list again (filters, "view more").
        key={apiProduct?.id ?? product.id}
        productId={apiProduct?.id ?? product.id}
        productTitle={product.title}
        productImage={galleryImages[0] ?? null}
        variantId={product.variantId}
        reviews={pdpReviews}
      />

      {apiProduct?.id ? (
        <ProductCompanions
          productId={apiProduct.id}
          marketCode={zoneCode}
          omitGroupIds={youMayAlsoLike.length > 0 ? ["also"] : []}
          fallback={null}
        />
      ) : null}
      {youMayAlsoLike.length ? (
        <PdpRelatedRail
          id="also-like-heading"
          heading={
            <>
              You may also <em className={relatedEm}>like.</em>
            </>
          }
          seeAllHref={`/collections/${MERCH_RAIL_SLUGS.pdpAlsoLike}`}
          products={youMayAlsoLike}
        />
      ) : null}
      {related.length && moreFromCollection ? (
        <PdpRelatedRail
          id="related-heading"
          heading={`More from ${moreFromHeading}.`}
          seeAllHref={`/collections/${moreFromCollection.slug}`}
          products={related}
          collectionSlug={moreFromCollection.slug}
        />
      ) : null}
      <RecentlyViewed excludeProductId={apiProduct?.id ?? product.id} />

      {prVideo ? (
        <PdpPrVideo
          video={prVideo}
          poster={galleryImages[0]}
          title={product.title}
          resetKey={slug}
          onError={markFailed}
        />
      ) : null}
    </div>
  );
}
