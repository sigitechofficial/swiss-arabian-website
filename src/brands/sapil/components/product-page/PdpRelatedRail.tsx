"use client";

import { useRef } from "react";
import type { ProductSummary } from "@/features/catalog/types/product";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SectionHead, Wrap } from "../../ui";
import { RailButtons } from "../catalog/RailButtons";
import { SapilProductCard } from "../product";

/** Rail cards: 4 → 3 (≤1100px) → 2 (≤900px) visible. */
const RAIL_SIZES = "(max-width: 900px) 50vw, (max-width: 1100px) 33vw, 340px";

/** v9 `.pdp-more`: "You may also like / More to fall for." with a card rail and arrows. */
export function PdpRelatedRail({ products }: { products: ProductSummary[] }) {
  const t = useSapilCopy();
  const railRef = useRef<HTMLDivElement>(null);
  if (!products.length) return null;
  return (
    <section aria-labelledby="related-heading" className="bg-sapil-white pt-[64px] pb-[80px] max-900:pt-[48px] max-900:pb-[56px]">
      <Wrap>
        <SectionHead
          id="related-heading"
          eyebrow={t("product.youMayAlsoLike")}
          title={t("product.moreToFallFor")}
          accent={t("product.moreToFallForAccent")}
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
