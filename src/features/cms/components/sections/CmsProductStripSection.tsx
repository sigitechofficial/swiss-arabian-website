"use client";

import { LandingProductsBand } from "@/features/home/components/landing/LandingProductsBand";
import { LandingTrending } from "@/features/home/components/landing/LandingTrending";
import type { ProductSummary } from "@/features/catalog/types/product";

export type CmsProductStripVariant = "productsBand" | "trending";

type Props = {
  title: string;
  products: ProductSummary[];
  viewAllHref?: string | null;
  viewAllLabel?: string | null;
  /** `productsBand` matches Best Sellers; `trending` matches Trending Now. */
  variant?: CmsProductStripVariant;
  collectionSlug?: string;
};

/**
 * Thin CMS adapter over the real landing product strips so published
 * Homepage sections keep the same card chrome and interactions.
 */
export function CmsProductStripSection({
  title,
  products,
  viewAllHref,
  viewAllLabel,
  variant = "trending",
  collectionSlug,
}: Props) {
  if (!products.length) return null;

  if (variant === "productsBand") {
    return (
      <LandingProductsBand
        products={products}
        title={title}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
        collectionSlug={collectionSlug}
      />
    );
  }

  return (
    <LandingTrending
      products={products}
      title={title}
      viewAllHref={viewAllHref}
      viewAllLabel={viewAllLabel}
      collectionSlug={collectionSlug}
    />
  );
}
