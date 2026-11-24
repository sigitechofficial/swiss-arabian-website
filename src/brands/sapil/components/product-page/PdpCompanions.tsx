"use client";

import { RecommendationSection } from "@/components/shared/RecommendationSection";
import { useRef } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { companionCard, companionRef, useProductCompanions } from "@/features/promotions/hooks/useProductCompanions";
import type { RecommendedProduct } from "@/lib/analytics/siteEvents";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SectionHead, SummaryRow, Wrap, buttonClass, cx } from "../../ui";
import { RailButtons } from "../catalog/RailButtons";
import { SapilProductCard } from "../product";
import { SapilLocaleLink } from "../product/SapilLocaleLink";

const RAIL_SIZES = "(max-width: 900px) 50vw, (max-width: 1100px) 33vw, 340px";

/**
 * "Often bought together" on the product page, from the same companion offers
 * as Swiss Arabian (shared `useProductCompanions`): pick the bottles of the
 * first group (this one pre-selected), see the bundle price, add them all to
 * the bag. Further groups are v9 card rails. Nothing when there are none.
 */
export function PdpCompanions({
  productId,
  marketCode,
  money,
  omitGroupIds,
}: {
  productId: string;
  marketCode?: string | null;
  money: (n: number) => string;
  /** Groups the page already shows itself ("also": its own "More to fall for"). */
  omitGroupIds?: string[];
}) {
  const t = useSapilCopy();
  const c = useProductCompanions({ productId, marketCode, omitGroupIds });
  if (c.pending || c.empty || !c.data) return null;
  const { data } = c;

  return (
    <>
      {c.bundle && c.pieces.length > 0 ? (
        <RecommendationSection
          surface="pdp_bought_together"
          products={c.pieces.filter((p) => p.sku !== data.current?.sku).map(companionRef)}
          aria-labelledby="companion-heading"
          className="bg-sapil-white pt-[64px] pb-[72px] max-900:pt-[48px] max-900:pb-[56px]"
        >
          <Wrap>
            <SectionHead
              // Product pages: headings only for the product's own content (SEO audit p12).
              as="p"
              id="companion-heading"
              eyebrow={t("product.companionsEyebrow")}
              title={c.bundle.heading}
              description={c.message ?? undefined}
            />
            <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-[24px] items-start max-900:grid-cols-1">
              <ul className="list-none p-0 m-0 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[16px]">
                {c.pieces.map((product) => {
                  const current = product.sku === data.current?.sku;
                  const on = c.selected.includes(product.sku);
                  const label = current ? data.copy.thisProduct : data.copy.addSelected;
                  return (
                    <li
                      key={product.sku}
                      className={cx(
                        "relative rounded-[22px] bg-sapil-paper p-[12px] border-2 [transition:border-color_.2s]",
                        !product.inStock ? "opacity-50 border-transparent" : on ? "border-sapil-accent" : "border-transparent hover:border-sapil-line-2",
                      )}
                    >
                      <label className={cx("flex items-center justify-between gap-[8px] px-[4px] pb-[8px]", product.inStock ? "cursor-pointer" : "cursor-not-allowed")}>
                        <span className={cx("text-[11px] font-[700] tracking-[.12em] uppercase", on ? "text-sapil-accent" : "text-sapil-muted")}>{label}</span>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={!product.inStock}
                          aria-label={`${label} ${product.title}`}
                          onChange={() => c.toggle(product.sku)}
                          className="w-[22px] h-[22px] accent-[var(--sapil-accent)]"
                        />
                      </label>
                      {product.slug ? (
                        <SapilLocaleLink href={`/products/${product.slug}`} aria-label={product.title} className="block relative aspect-square rounded-[16px] bg-sapil-tile overflow-hidden">
                          {product.image ? (
                            <MediaImage src={product.image} alt={t("product.imageAlt", { name: product.title })} fill sizes="200px" className="object-contain p-[10px]" />
                          ) : null}
                        </SapilLocaleLink>
                      ) : null}
                      <p className="mt-[10px] px-[4px] text-[15px] leading-[1.25] font-[500]">{product.title}</p>
                      {product.price ? <p className="px-[4px] text-[14px] font-[600] text-sapil-accent tabular-nums">{product.price}</p> : null}
                    </li>
                  );
                })}
              </ul>
              <aside className="bg-sapil-paper rounded-[24px] p-[22px]">
                <p className="text-[12px] font-[700] tracking-[.14em] uppercase text-sapil-muted mb-[10px]">{t("product.companionsSummary")}</p>
                {c.subtotal != null && c.total != null && c.discount != null ? (
                  <>
                    <SummaryRow label={data.copy.before} value={money(c.subtotal)} />
                    {c.discount > 0 ? <SummaryRow variant="save" label={data.copy.saving} value={`−${money(c.discount)}`} /> : null}
                    <SummaryRow variant="total" label={data.copy.total} value={money(c.total)} />
                  </>
                ) : null}
                <button
                  type="button"
                  disabled={!c.ready}
                  onClick={c.addSelected}
                  className={cx(buttonClass("dark"), "w-full mt-[8px] !bg-sapil-accent disabled:opacity-50 disabled:cursor-not-allowed")}
                >
                  {data.copy.addSelected}
                </button>
              </aside>
            </div>
          </Wrap>
        </RecommendationSection>
      ) : null}
      {c.later.map((group) => (
        <CompanionRail key={group.id} products={group.products.map(companionRef)} heading={group.heading} seeAllPath={group.seeAllPath} seeAll={data.copy.seeAll}>
          {group.products.map((product) => {
            const card = companionCard(product, c.currency);
            return card ? <SapilProductCard key={product.sku} product={card} imageSizes={RAIL_SIZES} /> : null;
          })}
        </CompanionRail>
      ))}
    </>
  );
}

function CompanionRail({
  heading,
  seeAllPath,
  seeAll,
  products,
  children,
}: {
  products: RecommendedProduct[];
  heading: string;
  seeAllPath: string | null;
  seeAll: string;
  children: React.ReactNode;
}) {
  const t = useSapilCopy();
  const railRef = useRef<HTMLDivElement>(null);
  return (
    <RecommendationSection surface="pdp_companions" products={products} className="pt-[56px] pb-[64px]">
      <Wrap>
        <SectionHead
          as="p"
          title={heading}
          actions={
            <div className="flex items-center gap-[16px]">
              {seeAllPath ? (
                <SapilLocaleLink href={seeAllPath} className="text-[15px] font-[600] text-sapil-accent hover:underline">
                  {seeAll}
                </SapilLocaleLink>
              ) : null}
              <RailButtons railRef={railRef} gap={24} previousLabel={t("product.previous")} nextLabel={t("product.next")} />
            </div>
          }
        />
        <WishlistStatusScope>
          <div
            ref={railRef}
            className="grid grid-flow-col auto-cols-[calc((100%-72px)/4)] gap-[24px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-[4px] [&>*]:snap-start max-1100:auto-cols-[calc((100%-48px)/3)] max-900:auto-cols-[calc(50%-8px)] max-900:gap-[16px]"
          >
            {children}
          </div>
        </WishlistStatusScope>
      </Wrap>
    </RecommendationSection>
  );
}
