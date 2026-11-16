"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ensureInsiderProductPage } from "@/lib/insider";
import { useMarket } from "@/providers/MarketProvider";
import { MERCH_RAIL_SLUGS, pickMoreFromCollection, useMerchRail } from "@/features/merchandising";
import { useBrowsedCollection } from "@/features/merchandising/utils/browsedCollection";
import { rememberViewedProduct } from "@/features/promotions/utils/emptyBagMemory";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { catalogKeys, fetchCollectionProducts, fetchProductBySlug } from "../api/catalog.service";
import type { CatalogProduct } from "../constants/catalogProducts";
import type { ProductDetail } from "../types/product";
import { toCatalogProduct } from "../utils/toCatalogProduct";
import { pyramidFromMetafields } from "../utils/pdpMetafields";
import { shippingDaysLine, shippingTabCopy, shippingThresholdLine } from "../utils/pdpShipping";
import { useMarketDocument } from "./useMarketDocument";

export function cartLineForProduct(
  lines: CartLine[],
  product: Pick<CatalogProduct, "variantId" | "sku" | "slug">,
): CartLine | undefined {
  const keys = [product.variantId, product.sku, product.slug].filter((key): key is string =>
    Boolean(key?.trim()),
  );
  return lines.find((line) => keys.includes(line.variantId) || line.slug === product.slug);
}

/** The catalog's "no description yet" text is not a description. */
const DESCRIPTION_PLACEHOLDER_PREFIX = "Product details will appear";

export type ProductDetailPageInput = {
  /** Product the server rendered (null when it could not be loaded there). */
  product: ProductDetail | null;
  /** Market the server rendered `product` for. */
  serverZoneCode?: string | null;
  /** Route slug. */
  slug: string;
};

/**
 * Everything a product page needs besides its look, shared by every brand:
 * the product for the shopper's market (server copy, or the client's own for
 * another market), its bag line, notes, delivery promise, reviews, images that
 * failed to load, the related rails, and the page-view side effects
 * (Insider product page, "recently viewed").
 */
export function useProductDetailPage({ product: serverDetail, serverZoneCode = null, slug: routeSlug }: ProductDetailPageInput) {
  const { marketId } = useMarket();
  const zoneCode = marketId ?? "";
  // The page is prerendered for the default market: another market loads its own product.
  const { data: detail, otherMarket, query: clientProduct } = useMarketDocument({
    server: serverDetail,
    serverZoneCode,
    queryKey: (zone) => catalogKeys.detail(routeSlug, zone),
    fetch: (market) => fetchProductBySlug(routeSlug, market.zoneCode, market),
  });
  const apiProduct = detail;
  const slug = detail?.slug || routeSlug;

  const product = useMemo(
    () => (apiProduct ? toCatalogProduct(apiProduct) : undefined),
    [apiProduct],
  );

  const livePyramid = useMemo(() => pyramidFromMetafields(apiProduct?.pdpMetafields), [apiProduct]);
  const metafields = apiProduct?.pdpMetafields;
  const shippingPromise = apiProduct?.shippingPromise ?? null;
  const pdpReviews = apiProduct?.reviews ?? null;
  const reviewSummary = pdpReviews?.summary;
  // Stars under the name once a product has enough reviews (Admin → Reviews → Settings).
  const showReviewRating = Boolean(
    reviewSummary &&
      reviewSummary.reviewCount > 0 &&
      reviewSummary.reviewCount >= (pdpReviews?.display.minReviewsToShowStars ?? 1),
  );
  const daysLine = shippingPromise ? shippingDaysLine(shippingPromise) : null;
  const thresholdLine = shippingPromise ? shippingThresholdLine(shippingPromise) : null;
  const liveShippingCopy = shippingTabCopy(shippingPromise);

  const [failedImages, setFailedImages] = useState<string[]>([]);
  const markFailed = useCallback((src: string) => {
    setFailedImages((prev) => (prev.includes(src) ? prev : [...prev, src]));
  }, []);

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

  const youMayAlsoLikeRail = useMerchRail(MERCH_RAIL_SLUGS.pdpAlsoLike, product?.id ? [product.id] : []);

  // The collection the shopper came from (when the product is in it), else the
  // product's own best collection.
  const browsedCollection = useBrowsedCollection(apiProduct?.collections);
  const moreFromCollection =
    browsedCollection ?? pickMoreFromCollection(apiProduct?.collections);
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

  /** Up to 4 more products of `moreFromCollection` (not this one, not in the bag). */
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

  /** Up to 4 picks of the "you may also like" merchandising rail (not already in `related`). */
  const youMayAlsoLike = useMemo(() => {
    const usedIds = new Set(related.map((item) => item.id));
    return youMayAlsoLikeRail.filter((item) => !usedIds.has(item.id)).slice(0, 4);
  }, [youMayAlsoLikeRail, related]);

  const clientStillLoading =
    (!serverDetail || otherMarket) && !clientProduct.isFetched && !clientProduct.isError;

  const galleryImages = product
    ? (product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [])
        .filter((src, index, arr): src is string => Boolean(src) && arr.indexOf(src) === index)
        .filter((src) => !failedImages.includes(src))
    : [];
  const prVideo =
    apiProduct?.prVideo && !failedImages.includes(apiProduct.prVideo.url) ? apiProduct.prVideo : undefined;
  const description =
    apiProduct?.description && !apiProduct.description.startsWith(DESCRIPTION_PLACEHOLDER_PREFIX)
      ? apiProduct.description
      : null;

  return {
    /** The API product (detail fields: collections, reviews, metafields …). */
    detail: apiProduct ?? null,
    /** The same product with listing facets (cards, buy box). */
    product,
    slug,
    zoneCode,
    metafields,
    livePyramid,
    shippingPromise,
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
    /** No product yet and the browser is still fetching it. */
    clientStillLoading,
    /** No product because the store could not be reached. */
    loadFailed: !product && clientProduct.isError,
    retry: () => void clientProduct.refetch(),
  };
}
