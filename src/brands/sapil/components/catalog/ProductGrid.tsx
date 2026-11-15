"use client";

import type { ReactNode } from "react";
import type { ProductSummary } from "@/features/catalog/types/product";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button } from "../../ui";
import { cx, SAPIL_PASTELS } from "../../ui/shared";
import { SapilProductCard, type CardImagePriority } from "../product";

/** v9 `.grid`: 4 columns → 3 at ≤1100px → 2 at ≤900px. */
export const GRID =
  "grid grid-cols-4 gap-x-[24px] gap-y-[40px] max-1100:grid-cols-3 max-900:grid-cols-2 max-900:gap-x-[16px] max-900:gap-y-[32px]";

/** Cards in the first row load first; the very first is the likely LCP image. */
export function cardPriority(index: number, rowSize = 4): CardImagePriority {
  if (index === 0) return "high";
  return index < rowSize ? "eager" : "lazy";
}

/** v9 `.empty`: dashed box across the grid. */
export function GridMessage({
  title,
  children,
  role,
  action,
}: {
  title: ReactNode;
  children?: ReactNode;
  role?: "alert" | "status";
  action?: ReactNode;
}) {
  return (
    <div
      role={role}
      className="col-span-full border border-dashed border-sapil-line-2 rounded-sapil p-[48px] text-center text-sapil-ink-2 max-600:p-[32px]"
    >
      <b className="block font-sapil-serif font-[400] text-[24px] text-sapil-ink mb-[6px]">{title}</b>
      {children}
      {action ? <div className="mt-[18px] flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Loading: card-shaped tiles on the pastels (no layout shift when products arrive). */
export function GridSkeleton({ count = 8, label }: { count?: number; label: string }) {
  return (
    <div className={GRID} role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex flex-col">
          <div
            className="aspect-[1/1.5] rounded-[18px] max-749:rounded-[16px] animate-pulse"
            style={{ background: `var(--sapil-p-${SAPIL_PASTELS[i % SAPIL_PASTELS.length]})` }}
          />
          <div className="pt-[14px]">
            <div className="h-[11px] w-[40%] rounded-full bg-sapil-line mb-[14px]" />
            <div className="h-[16px] w-[70%] rounded-full bg-sapil-line mb-[8px]" />
            <div className="h-[16px] w-[30%] rounded-full bg-sapil-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

export type ProductGridProps = {
  products: ProductSummary[] | undefined;
  loading?: boolean;
  loadFailed?: boolean;
  onRetry?: () => void;
  /** Shown when the list is empty (filters, empty collection …). */
  empty: ReactNode;
  /** Navy pill tags per product (e.g. matched notes), keyed by product id. */
  highlightTags?: Record<string, string[]>;
  /** Cards of the first row load eagerly (false for grids below the fold). */
  aboveFold?: boolean;
  className?: string;
};

/** The product grid with its loading, error and empty states (one wishlist request for all cards). */
export function ProductGrid({
  products,
  loading,
  loadFailed,
  onRetry,
  empty,
  highlightTags,
  aboveFold = true,
  className,
}: ProductGridProps) {
  const t = useSapilCopy();
  if (loading) return <GridSkeleton label={t("catalog.loading")} />;
  if (loadFailed) {
    return (
      <div className={GRID}>
        <GridMessage
          role="alert"
          title={t("catalog.loadFailedTitle")}
          action={
            onRetry ? (
              <Button variant="line" onClick={onRetry}>
                {t("common.tryAgain")}
              </Button>
            ) : null
          }
        >
          {t("catalog.loadFailedBody")}
        </GridMessage>
      </div>
    );
  }
  if (!products?.length) return <div className={GRID}>{empty}</div>;
  return (
    <WishlistStatusScope>
      <div className={cx(GRID, className)}>
        {products.map((product, i) => (
          <SapilProductCard
            key={product.id}
            product={product}
            imagePriority={aboveFold ? cardPriority(i) : "lazy"}
            highlightTags={highlightTags?.[product.id]}
            // the grid sits right under the page h1 (no section heading)
            headingLevel="h2"
          />
        ))}
      </div>
    </WishlistStatusScope>
  );
}
