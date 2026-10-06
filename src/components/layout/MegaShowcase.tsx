"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { catalogKeys, fetchCollectionProducts } from "@/features/catalog/api/catalog.service";
import { imagesSettled, useLoadedImages } from "@/features/catalog/hooks/useLoadedImages";
import { stripHtml } from "@/features/catalog/utils/catalogHtml";
import type { ChromeMega } from "@/features/home/constants/chromeNav";
import { MEGA_PRODUCTS, type MegaProduct } from "@/features/home/constants/megaProducts";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import {
  megaProd,
  megaProdMedia,
  megaProdMediaLoading,
  megaProdMeta,
  megaProdName,
  megaProdPrice,
  megaProducts,
  megaPromo,
  megaPromoCopy,
  megaPromoCta,
  megaPromoMedia,
  megaPromoMediaCover,
  megaSkel,
  megaSkelName,
} from "@/styles/siteChrome";

const MEGA_PRODUCT_COUNT = 4;

/** Live menu ids whose hand-picked lineup is stored under a shorter key. */
const CURATED_ALIAS: Record<string, string> = {
  "perfume-oils": "oils",
  "best-sellers": "best",
};

function collectionSlug(href: string): string | null {
  const match = href.match(/^\/collections\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function ProductTile({ product }: { product: MegaProduct }) {
  return (
    <Link className={megaProd} href={`/products/${product.slug}`}>
      <span className={megaProdMedia}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" />
      </span>
      <span className={megaProdName}>{product.name}</span>
      {product.notes ? <span className={megaProdMeta}>{product.notes}</span> : null}
      <span className={megaProdPrice}>{formatMoney(product.price, product.currency)}</span>
    </Link>
  );
}

/**
 * Right-hand side of every mega panel: four product tiles (image, name,
 * notes, price). Live products from the menu's own collection are used when
 * their images actually load; menus whose collection is empty fall back to
 * the hand-picked lineup, so no panel drops to a bare promo banner.
 */
export function MegaShowcase({
  item,
  itemVariants,
}: {
  item: ChromeMega;
  itemVariants: Variants;
}) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const slug = collectionSlug(item.href);

  const liveQuery = useQuery({
    queryKey: [
      ...catalogKeys.collectionProducts(slug ?? "", zoneCode, 1, 8, undefined, {
        page: 1,
        limit: 8,
        sort: "bestselling",
      }),
      market?.salesChannelCode ?? "",
    ],
    queryFn: () =>
      fetchCollectionProducts(
        slug as string,
        zoneCode,
        {
          page: 1,
          limit: 8,
          sort: "bestselling",
        },
        market,
      ),
    enabled: Boolean(slug && market),
    staleTime: 5 * 60_000,
  });

  const candidates = liveQuery.data?.products ?? [];
  const candidateImages = candidates.map((p) => p.imageUrl);
  const loadedImages = useLoadedImages(candidateImages);

  const live: MegaProduct[] = candidates
    .filter((p) => p.imageUrl && loadedImages.has(p.imageUrl))
    .slice(0, MEGA_PRODUCT_COUNT)
    .map((p) => ({
      id: p.id,
      name: p.title,
      slug: p.slug,
      price: p.price ?? 0,
      currency: p.currency,
      image: p.imageUrl as string,
      notes: p.subtitle ? cardEyebrow(stripHtml(p.subtitle)) : undefined,
    }));

  const curated =
    MEGA_PRODUCTS[item.id] ?? MEGA_PRODUCTS[CURATED_ALIAS[item.id]] ?? MEGA_PRODUCTS.perfumes ?? [];

  // Hold the tiles until the live lineup is known, so the panel never flashes
  // the fallback products and then swaps them out.
  const waiting =
    Boolean(slug) &&
    !liveQuery.isError &&
    (liveQuery.isPending ||
      (live.length < MEGA_PRODUCT_COUNT && !imagesSettled(candidateImages)));

  if (waiting) {
    return (
      <motion.div className={megaProducts} variants={itemVariants} aria-busy="true">
        {Array.from({ length: MEGA_PRODUCT_COUNT }, (_, i) => (
          <span className={megaProd} key={i} aria-hidden="true">
            <span className={megaProdMediaLoading} />
            <span className={`${megaSkel} ${megaSkelName}`} />
            <span className={megaSkel} />
          </span>
        ))}
      </motion.div>
    );
  }

  // A panel always shows a full, matching row: the live lineup only when four
  // of its images load (many catalog media URLs 404), otherwise the curated
  // cutouts — never a half-live, half-cutout mix.
  const products = live.length >= MEGA_PRODUCT_COUNT ? live : curated;

  if (products.length) {
    return (
      <motion.div className={megaProducts} variants={itemVariants} role="list">
        {products.slice(0, MEGA_PRODUCT_COUNT).map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div className={megaPromo} variants={itemVariants}>
      <div className={item.promo.cover ? `${megaPromoMedia} ${megaPromoMediaCover}` : megaPromoMedia}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.promo.image} alt="" loading="lazy" />
      </div>
      <p className={megaPromoCopy}>{item.promo.copy}</p>
      <Link className={megaPromoCta} href={item.promo.href}>
        {item.promo.cta}
      </Link>
    </motion.div>
  );
}
