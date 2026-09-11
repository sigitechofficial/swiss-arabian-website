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
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";

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
    <Link className="mega__prod" href={`/products/${product.slug}`}>
      <span className="mega__prod-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" />
      </span>
      <span className="mega__prod-name">{product.name}</span>
      {product.notes ? <span className="mega__prod-meta">{product.notes}</span> : null}
      <span className="mega__prod-price">{formatMoney(product.price, product.currency)}</span>
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
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const slug = collectionSlug(item.href);

  const liveQuery = useQuery({
    queryKey: catalogKeys.collectionProducts(slug ?? "", zoneCode, 1, 8),
    queryFn: () => fetchCollectionProducts(slug as string, zoneCode, { page: 1, limit: 8 }),
    enabled: Boolean(slug),
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
      <motion.div className="mega__products" variants={itemVariants} aria-busy="true">
        {Array.from({ length: MEGA_PRODUCT_COUNT }, (_, i) => (
          <span className="mega__prod mega__prod--loading" key={i} aria-hidden="true">
            <span className="mega__prod-media" />
            <span className="mega__prod-skel mega__prod-skel--name" />
            <span className="mega__prod-skel" />
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
      <motion.div className="mega__products" variants={itemVariants} role="list">
        {products.slice(0, MEGA_PRODUCT_COUNT).map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div className="mega__promo" variants={itemVariants}>
      <div
        className={
          item.promo.cover ? "mega__promo-media mega__promo-media--cover" : "mega__promo-media"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.promo.image} alt="" loading="lazy" />
      </div>
      <p className="mega__promo-copy">{item.promo.copy}</p>
      <Link className="pill pill--solid mega__promo-cta" href={item.promo.href}>
        {item.promo.cta}
      </Link>
    </motion.div>
  );
}
