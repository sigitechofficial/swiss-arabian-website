"use client";

import { useRef } from "react";
import { useRecentlyViewedProducts } from "@/features/promotions/hooks/useRecentlyViewedProducts";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SectionHead, Wrap } from "../../ui";
import { RailButtons } from "../catalog/RailButtons";
import { SapilProductCard } from "../product";

/** Rail cards: 4 → 3 (≤1100px) → 2 (≤900px) visible (same as "More to fall for"). */
const RAIL_SIZES = "(max-width: 900px) 50vw, (max-width: 1100px) 33vw, 340px";

/**
 * "Recently viewed" under the product page rails: the shopper's own history
 * (this browser), shared logic with Swiss Arabian, drawn as a v9 card rail on
 * paper. Nothing until the shopper has looked at other bottles.
 */
export function PdpRecentlyViewed({ excludeProductId }: { excludeProductId: string }) {
  const t = useSapilCopy();
  const railRef = useRef<HTMLDivElement>(null);
  const { products } = useRecentlyViewedProducts(excludeProductId, 8);
  if (!products.length) return null;
  return (
    <section aria-labelledby="recently-viewed-heading" className="pt-[64px] pb-[80px] max-900:pt-[48px] max-900:pb-[56px]">
      <Wrap>
        <SectionHead
          // Product pages: headings only for the product's own content (SEO audit p12).
          as="p"
          id="recently-viewed-heading"
          eyebrow={t("product.recentlyEyebrow")}
          title={t("product.recentlyTitle")}
          accent={t("product.recentlyAccent")}
          actions={<RailButtons railRef={railRef} gap={24} previousLabel={t("product.previous")} nextLabel={t("product.next")} />}
        />
        <WishlistStatusScope>
          <div
            ref={railRef}
            className="grid grid-flow-col auto-cols-[calc((100%-72px)/4)] gap-[24px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-[4px] [&>*]:snap-start max-1100:auto-cols-[calc((100%-48px)/3)] max-900:auto-cols-[calc(50%-8px)] max-900:gap-[16px]"
          >
            {products.map((product) => (
              <SapilProductCard key={product.id} product={product} imageSizes={RAIL_SIZES} />
            ))}
          </div>
        </WishlistStatusScope>
      </Wrap>
    </section>
  );
}
