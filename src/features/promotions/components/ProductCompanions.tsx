"use client";

import { RecommendationSection } from "@/components/shared/RecommendationSection";
import type { ReactNode } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { bottle } from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";
import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
import { MoneySummary } from "./MoneySummary";
import { companionCard, companionRef, useProductCompanions } from "../hooks/useProductCompanions";
import {
  cartCta,
  cartCtaDisabled,
  cartSummary,
  cartSummaryTitle,
  cartTotals,
} from "@/styles/cartChrome";
import {
  related,
  relatedAll,
  relatedGrid,
  relatedHead,
  relatedTitle,
} from "@/styles/pdpChrome";
import { MediaImage } from "@/components/ui/MediaImage";

function pieceCardClass(on: boolean, inStock: boolean) {
  const base =
    "group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-2 transition-[border-color,box-shadow,background-color] duration-200";
  if (!inStock)
    return `${base} cursor-not-allowed border-[#241f1b]/10 opacity-50`;
  if (on) {
    return `${base} border-copper bg-[#fffaf6] shadow-[0_0_0_1px_#8c4435,0_16px_36px_rgba(140,68,53,0.16)]`;
  }
  return `${base} border-[#241f1b]/10 shadow-[0_8px_22px_rgba(60,40,25,0.05)] hover:border-copper/45 hover:shadow-[0_14px_30px_rgba(140,68,53,0.12)]`;
}

function SelectMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-full border border-[#241f1b]/18 bg-white text-transparent shadow-[0_1px_2px_rgba(36,31,27,0.06)] transition-colors peer-checked:border-copper peer-checked:bg-copper peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-copper/35 peer-disabled:opacity-40"
    >
      <svg
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path
          d="M3.2 8.2 6.4 11.2 12.8 4.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ProductCompanions({
  productId,
  marketCode,
  fallback,
  omitGroupIds = [],
}: {
  productId: string;
  marketCode?: string | null;
  fallback: ReactNode;
  /** Merch already renders these groups, so the companion copy is left out. */
  omitGroupIds?: string[];
}) {
  const t = useShopCopy();
  // Data, selection, price preview and "add selected": shared with every brand.
  const {
    pending,
    empty,
    data,
    currency,
    bundle,
    later,
    pieces,
    selected,
    toggle,
    message,
    subtotal,
    total,
    discount,
    ready,
    addSelected,
  } = useProductCompanions({ productId, marketCode, omitGroupIds });
  if (pending) return null;
  if (empty || !data) return <>{fallback}</>;

  return (
    <>
      {bundle && pieces.length > 0 ? (
        <RecommendationSection
          surface="pdp_bought_together"
          products={pieces.filter((p) => p.sku !== data.current?.sku).map(companionRef)}
          className="bg-warm py-16"
          aria-labelledby="companion-heading"
        >
          <div className={pageContainer}>
            <div className="mb-8 flex items-end justify-between gap-6 max-[900px]:grid max-[900px]:grid-cols-1 [&_[data-heading]]:m-0 [&_[data-heading]]:text-[clamp(1.6rem,3vw,2.2rem)] [&_[data-heading]]:font-medium">
              <div>
                <p className="m-0 mb-1.5 text-[0.72rem] font-bold tracking-[0.08em] text-copper uppercase">
                  {t("promotions.companions.eyebrow")}
                </p>
                <div data-heading id="companion-heading">{bundle.heading}</div>
              </div>
              {message ? <p className="m-0">{message}</p> : null}
            </div>
            <div className="grid items-start gap-5 max-[900px]:grid-cols-1 min-[901px]:grid-cols-[minmax(0,1fr)_300px]">
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 p-0">
                {pieces.map((product) => {
                  const current = product.sku === data.current?.sku;
                  const on = selected.includes(product.sku);
                  const label = current
                    ? data.copy.thisProduct
                    : data.copy.addSelected;
                  const media = product.image ? (
                    <MediaImage
                      src={product.image}
                      alt=""
                      width={240}
                      height={240}
                      className="aspect-square w-full object-contain p-3"
                    />
                  ) : (
                    <span
                      className={`${bottle} aspect-square w-full`}
                      aria-hidden="true"
                    />
                  );
                  return (
                    <li
                      key={product.sku}
                      className={pieceCardClass(on, product.inStock)}
                    >
                      <label
                        className={`flex items-center justify-between gap-2 px-1.5 py-1 ${product.inStock ? "cursor-pointer" : "cursor-not-allowed"}`}
                      >
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={on}
                          disabled={!product.inStock}
                          aria-label={`${label} ${product.title}`}
                          onChange={() => toggle(product.sku)}
                        />
                        <span
                          className={`text-[0.68rem] font-bold tracking-[0.08em] uppercase transition-colors ${on ? "text-copper" : "text-[#6f6152]"}`}
                        >
                          {label}
                        </span>
                        <SelectMark />
                      </label>
                      {product.slug ? (
                        <LocaleLink
                          href={`/products/${product.slug}`}
                          className="mx-1 block overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f1e7d4_100%)]"
                          aria-label={product.title}
                        >
                          {media}
                        </LocaleLink>
                      ) : (
                        <span className="mx-1 block overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f1e7d4_100%)]">
                          {media}
                        </span>
                      )}
                      <div className="flex flex-1 flex-col gap-1 px-2 pt-3 pb-2">
                        <p className="m-0 font-[family-name:var(--font-display)] text-[0.98rem] leading-snug text-[#2a201a]">
                          {product.title}
                        </p>
                        {product.price ? (
                          <p className="m-0 text-[0.85rem] font-semibold text-copper">
                            {product.price}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <aside className={cartSummary}>
                <p className={cartSummaryTitle}>{t("promotions.companions.summary")}</p>
                {subtotal != null && total != null && discount != null ? (
                  <MoneySummary
                    className={cartTotals}
                    currency={currency}
                    subtotal={subtotal}
                    discount={discount}
                    shippingDiscount={0}
                    total={total}
                  />
                ) : null}
                {message ? (
                  <p className="mb-3 text-[0.85rem]">{message}</p>
                ) : null}
                <button
                  className={ready ? cartCta : `${cartCta} ${cartCtaDisabled}`}
                  type="button"
                  disabled={!ready}
                  onClick={addSelected}
                >
                  {data.copy.addSelected}
                </button>
              </aside>
            </div>
          </div>
        </RecommendationSection>
      ) : null}
      {later.map((group) => (
        <RecommendationSection
          surface="pdp_companions"
          products={group.products.map(companionRef)}
          className={related}
          key={group.id}
        >
          <div className={pageContainer}>
            <div className={relatedHead}>
              <p className={relatedTitle}>{group.heading}</p>
              {group.seeAllPath ? (
                <LocaleLink className={relatedAll} href={group.seeAllPath}>
                  {data.copy.seeAll}
                </LocaleLink>
              ) : null}
            </div>
            <ul className={relatedGrid} role="list">
              {group.products.map((product) => {
                const card = companionCard(product, currency);
                if (!card) return null;
                return (
                  <CatalogProductCard
                    key={product.sku}
                    product={card}
                    dense={false}
                    hideAdd={!product.inStock}
                  />
                );
              })}
            </ul>
          </div>
        </RecommendationSection>
      ))}
    </>
  );
}
