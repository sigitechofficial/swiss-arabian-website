"use client";

import { useEffect, useMemo, useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useQuery } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { ensureInsiderProductPage } from "@/lib/insider";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { MERCH_RAIL_SLUGS, pickMoreFromCollection, useMerchRail } from "@/features/merchandising";
import { ProductCompanions } from "@/features/promotions/components/ProductCompanions";
import { RecentlyViewed } from "@/features/promotions/components/RecentlyViewed";
import { rememberViewedProduct } from "@/features/promotions/utils/emptyBagMemory";
import { pageContainer } from "@/styles/siteChrome";
import { crumbsList } from "@/styles/shopChrome";
import { pdpHero, pdpSplit, relatedEm } from "@/styles/pdpChrome";
import { catalogKeys, fetchCollectionProducts, fetchProductBySlug } from "../api/catalog.service";
import type { ProductDetail } from "../types/product";
import {
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "../constants/catalogProducts";
import type { ProductDetailContent } from "../constants/productDetailContent";
import { toCatalogProduct } from "../utils/toCatalogProduct";
import { notesSectionTitle, pyramidFromMetafields } from "../utils/pdpMetafields";
import { shippingDaysLine, shippingTabCopy, shippingThresholdLine } from "../utils/pdpShipping";
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

function cartLineForProduct(lines: CartLine[], product: CatalogProduct): CartLine | undefined {
  const keys = [product.variantId, product.sku, product.slug].filter((key): key is string =>
    Boolean(key?.trim()),
  );
  return lines.find((line) => keys.includes(line.variantId) || line.slug === product.slug);
}

export function ProductDetailPageView({
  slug,
  product: detail,
}: {
  slug: string;
  product: ProductDetail | null;
}) {
  const copy = useShopCopy();
  const { marketId, catalogContext } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const { data: fetched, isLoading } = useQuery({
    queryKey: catalogKeys.detail(slug, zoneCode),
    queryFn: () => fetchProductBySlug(slug, zoneCode, catalogContext),
    enabled: Boolean(slug),
    ...(detail ? { initialData: detail, initialDataUpdatedAt: 0 } : {}),
  });
  const apiProduct = fetched ?? detail;

  const product = useMemo(
    () => (apiProduct ? toCatalogProduct(apiProduct) : undefined),
    [apiProduct],
  );

  const livePyramid = useMemo(() => pyramidFromMetafields(apiProduct?.pdpMetafields), [apiProduct]);
  const metafields = apiProduct?.pdpMetafields;
  const shippingPromise = apiProduct?.shippingPromise ?? null;
  const pdpReviews = apiProduct?.reviews ?? null;
  const reviewSummary = pdpReviews?.summary;
  const showReviewRating = Boolean(reviewSummary && reviewSummary.reviewCount > 0);
  const daysLine = shippingPromise ? shippingDaysLine(shippingPromise) : null;
  const thresholdLine = shippingPromise ? shippingThresholdLine(shippingPromise) : null;
  const liveShippingCopy = shippingTabCopy(shippingPromise);

  const content = useMemo<ProductDetailContent>(() => {
    const story = apiProduct?.description?.trim() || "";
    return { ...EMPTY_CONTENT, story, shipping: liveShippingCopy ?? "" };
  }, [apiProduct, liveShippingCopy]);

  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [reveal, setReveal] = useState(false);
  const lines = useCartStore((s) => s.lines);
  const cartLine = useMemo(
    () => (product ? cartLineForProduct(lines, product) : undefined),
    [lines, product],
  );

  useEffect(() => {
    if (!product) return;
    const category =
      apiProduct?.collections?.find((collection) => collection.isFeatured)?.name ||
      apiProduct?.collections?.[0]?.name ||
      product.houseCollection ||
      null;
    ensureInsiderProductPage({
      id: product.variantId || product.id,
      sku: product.sku || product.variantId || product.id,
      name: product.title,
      price: product.price ?? 0,
      currency: product.currency || "AED",
      imageUrl: product.imageUrl ?? product.imageUrls?.[0] ?? null,
      category,
      brand: apiProduct?.brandName ?? null,
      stock: product.availableQty ?? (product.inStock === false ? 0 : 1),
      size: product.subtitle,
      groupcode: product.id,
    });
  }, [apiProduct, product]);

  useEffect(() => {
    if (apiProduct?.id) rememberViewedProduct(apiProduct.id);
  }, [apiProduct?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, [slug]);

  const youMayAlsoLikeRail = useMerchRail(MERCH_RAIL_SLUGS.pdpAlsoLike, product?.id ? [product.id] : []);

  const moreFromCollection = pickMoreFromCollection(apiProduct?.collections);
  const { data: moreFromFeed } = useQuery({
    queryKey: catalogKeys.collectionProducts(moreFromCollection?.slug ?? "", zoneCode, 1, 12, true),
    queryFn: () =>
      fetchCollectionProducts(moreFromCollection!.slug, zoneCode, {
        page: 1,
        limit: 12,
        onlySellable: true,
      }),
    enabled: Boolean(zoneCode && moreFromCollection?.slug),
    retry: false,
  });

  const related = useMemo(() => {
    if (!product) return [];
    const inCart = new Set(lines.map((line) => line.slug).filter(Boolean));
    return (moreFromFeed?.products ?? [])
      .filter((item) => item.id !== product.id && item.slug !== product.slug)
      .filter((item) => item.isSellable !== false)
      .filter((item) => !inCart.has(item.slug))
      .map((item) => toCatalogProduct(item))
      .slice(0, 4);
  }, [moreFromFeed, product, lines]);

  const youMayAlsoLike = useMemo(() => {
    const usedIds = new Set(related.map((item) => item.id));
    return youMayAlsoLikeRail.filter((item) => !usedIds.has(item.id)).slice(0, 4);
  }, [youMayAlsoLikeRail, related]);

  const moreFromHeading = moreFromCollection?.name.replace(/\.$/, "") ?? "";

  useEffect(() => {
    [...youMayAlsoLike, ...related].forEach((item) => {
      const hoverImg = item.imageUrls?.[1];
      if (hoverImg && hoverImg !== item.imageUrl) {
        const img = new Image();
        img.src = hoverImg;
        img.decode?.().catch(() => {});
      }
    });
  }, [youMayAlsoLike, related]);

  if (!product && isLoading) {
    return <PageLoading fill />;
  }

  if (!product) {
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

  const galleryImages = (product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [])
    .filter((src, index, arr): src is string => Boolean(src) && arr.indexOf(src) === index)
    .filter((src) => !failedImages.includes(src));
  const prVideo = apiProduct?.prVideo && !failedImages.includes(apiProduct.prVideo.url) ? apiProduct.prVideo : undefined;
  const formatLabel =
    metafields?.size?.trim() ||
    (product.concentration ? CONCENTRATION_LABELS[product.concentration] : "");
  const notesHeading = notesSectionTitle(metafields);
  const notesRows = livePyramid;
  const description =
    apiProduct?.description && !apiProduct.description.startsWith("Product details will appear")
      ? apiProduct.description
      : null;

  const markFailed = (src: string) => {
    setFailedImages((prev) => (prev.includes(src) ? prev : [...prev, src]));
  };

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
            <PdpGallery images={galleryImages} title={product.title} resetKey={slug} onImageError={markFailed} />
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
        productId={apiProduct?.id ?? product.id}
        productTitle={product.title}
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
