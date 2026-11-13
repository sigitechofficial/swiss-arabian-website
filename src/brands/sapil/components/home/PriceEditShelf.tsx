"use client";

import { useMemo } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import { useMarketSettings } from "@/features/markets/hooks/useMarketSettings";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, Serif, Wrap, cx } from "../../ui";
import { ArrowIcon } from "../shared/icons";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";
import { parseAmount } from "../shared/money";
import { featuredPriceTier } from "../shell/shellData";
import { HomeSection } from "./HomeParts";

export type PriceBand = { key: string; min: number | null; max: number; count: number };

/**
 * v9 `priceOptions`: four even bands up to the edit's ceiling (rounded to 5),
 * counted over the products loaded; empty bands are left out.
 */
export function priceBands(prices: number[], ceiling: number): PriceBand[] {
  const cuts = [0, ...[0.25, 0.5, 0.75].map((f) => Math.round((ceiling * f) / 5) * 5), ceiling + 1];
  return cuts
    .slice(1)
    .map((hi, i) => {
      const lo = cuts[i];
      return {
        key: `b${i}`,
        min: lo || null,
        max: i === 3 ? ceiling : hi - 1,
        count: prices.filter((p) => p >= lo && p < hi).length,
      };
    })
    .filter((b) => b.count > 0);
}

/** Five bottles for the shelf, one per price where possible (v9 `shelfPicks`). */
export function shelfPicks(products: ProductSummary[]): ProductSummary[] {
  const withImage = products.filter((p) => p.imageUrl && p.price != null);
  const picks: ProductSummary[] = [];
  for (const p of withImage) {
    if (picks.length >= 5) break;
    if (!picks.some((x) => x.price === p.price)) picks.push(p);
  }
  for (const p of withImage) {
    if (picks.length >= 5) break;
    if (!picks.includes(p)) picks.push(p);
  }
  return picks;
}

const SHELF_HEIGHTS = ["h-[62%]", "h-[70%] z-[2]", "h-[80%] z-[3]", "h-[70%] z-[2]", "h-[62%]"];

/**
 * v9 "Under AED 99" banner: the market's featured price edit (admin price tiers),
 * its products from the listing (`maxPrice`), price chips with counts, a price-tag
 * shelf. Hidden until the market has price edits and products under the ceiling.
 */
export function PriceEditShelf() {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const settings = useMarketSettings();
  const tier = featuredPriceTier(settings.priceEditTiers);
  const currency = settings.currencyCode;
  const listing = useCatalogPlp({ kind: "products" }, { page: 1, maxPrice: tier != null ? String(tier) : undefined, sort: "price_desc" });
  const products = useMemo(
    () => (tier == null ? [] : (listing.products ?? []).filter((p) => p.price != null && p.price <= tier)),
    [listing.products, tier],
  );
  if (tier == null || !currency || !products.length) return null;

  const total = listing.pagination?.total ?? products.length;
  const from = parseAmount(listing.facets?.price?.min) ?? Math.min(...products.map((p) => p.price as number));
  const prices = products.map((p) => p.price as number);
  // Counts are exact only when every product under the ceiling is loaded.
  const bands = total <= products.length ? priceBands(prices, tier) : [];
  const picks = shelfPicks(products);
  const others = settings.priceEditTiers.filter((x) => x !== tier);
  const ceiling = price(tier, currency);
  const shelfOrder = picks;

  return (
    <HomeSection id="under99" label={t("home.underPrice", { amount: ceiling })}>
      <Wrap>
        <div className="relative grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-[40px] items-center rounded-[32px] pt-[56px] px-[56px] pb-[48px] bg-[linear-gradient(120deg,var(--sapil-p-pink)_0%,var(--sapil-p-peach)_55%,var(--sapil-p-butter)_100%)] overflow-hidden max-900:grid-cols-1 max-900:pt-[32px] max-900:px-[20px] max-900:pb-[24px] max-900:gap-[8px] max-900:rounded-[24px]">
          {settings.freeDeliveryThreshold != null ? (
            <span
              aria-hidden="true"
              className="absolute top-[28px] end-[28px] z-[3] w-[96px] h-[96px] rounded-full bg-sapil-p-butter text-sapil-ink grid place-content-center text-center font-[700] text-[12px] leading-[1.15] [transform:rotate(12deg)] shadow-[0_10px_24px_-12px_rgba(120,90,20,.3)] max-900:hidden"
            >
              <b className="block font-sapil-display font-[400] text-[28px] leading-[1]">{settings.freeDeliveryThreshold}+</b>
              {t("home.shipsFree")}
            </span>
          ) : null}
          <div>
            <p className={cx(EYEBROW, "!text-sapil-rose")}>{t("home.priceEyebrow", { amount: ceiling })}</p>
            <h2 className="font-sapil-display !font-[400] text-[clamp(48px,5vw,80px)] !leading-[.95] !tracking-[-.01em] mt-[16px] mb-[18px] max-900:text-[46px]">
              {t("home.priceTitle")} <Serif>{t("home.priceAccent")}</Serif>
            </h2>
            <p className="text-[17px] text-sapil-ink-2 max-w-[34ch] mb-[26px]">
              {t("home.priceLine", { count: total, from: price(from, currency), ceiling })}
            </p>
            {bands.length ? (
              <div className="flex flex-wrap gap-[10px] mb-[26px]" role="group" aria-label={t("home.priceChipsLabel")}>
                {bands.map((b) => (
                  <SapilLink
                    key={b.key}
                    href={`/products?${b.min ? `minPrice=${b.min}&` : ""}maxPrice=${b.max}`}
                    className="group/pc inline-flex items-center gap-[8px] h-[44px] px-[18px] rounded-full bg-sapil-white font-[600] text-[15px] shadow-[0_6px_16px_-10px_rgba(150,60,90,.35)] [transition:background_.2s,color_.2s,transform_.2s_var(--sapil-ease)] hover:bg-sapil-ink hover:text-sapil-white hover:[transform:translateY(-2px)]"
                  >
                    {b.min ? t("home.priceBand", { min: price(b.min, currency), max: price(b.max, currency) }) : t("home.underPrice", { amount: price(b.max + 1, currency) })}
                    <small className="text-[12px] font-[500] text-sapil-muted group-hover/pc:text-sapil-on-dark">{b.count}</small>
                  </SapilLink>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-[18px] flex-wrap">
              <Button
                href={`/products?under=${tier}`}
                LinkComponent={SapilLink}
                className="group/cta [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:[transition:transform_.25s_var(--sapil-ease)] hover:[&_svg]:[transform:translateX(4px)] rtl:[&_svg]:[transform:scaleX(-1)]"
              >
                {t("home.priceCta")}
                <ArrowIcon />
              </Button>
              {settings.freeDeliveryThreshold != null ? (
                <span className="text-[14px] text-sapil-ink-2 [&_b]:text-sapil-ink">
                  {t("home.freeOver")} <b>{price(settings.freeDeliveryThreshold, currency)}</b>
                </span>
              ) : null}
            </div>
            {others.length ? (
              <p className="mt-[16px] text-[14px] text-sapil-ink-2">
                {t("home.morePriceEdits")}{" "}
                {others.map((x, i) => (
                  <span key={x}>
                    {i > 0 ? " · " : null}
                    <SapilLink href={`/products?under=${x}`} className="font-[600] text-sapil-ink underline underline-offset-[3px]">
                      {t("home.underPrice", { amount: price(x, currency) })}
                    </SapilLink>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          <div className="relative h-[460px] flex items-end justify-center px-[4%] pb-[40px] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[8px] after:h-[44px] after:rounded-full after:bg-[rgba(255,255,255,.7)] after:shadow-[0_18px_30px_-18px_rgba(150,80,60,.35)] max-900:h-[280px] max-900:pb-[26px]">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-[-6px] [transform:translateX(-50%)] font-sapil-display text-[clamp(220px,24vw,360px)] leading-[.8] text-[rgba(255,255,255,.75)] pointer-events-none select-none max-900:text-[200px]"
            >
              {tier}
            </span>
            {shelfOrder.map((p, i) => (
              <SapilLink
                key={p.id}
                href={`/products/${p.slug}`}
                aria-label={t("home.shelfItem", { name: p.title, price: price(p.price as number, p.currency) })}
                className={cx(
                  "group/sb relative z-[1] flex-[1_1_0] min-w-0 block",
                  SHELF_HEIGHTS[i],
                  (i === 0 || i === 4) && "max-900:hidden",
                )}
              >
                <span className="absolute bottom-[-10%] left-1/2 h-full aspect-square [transform:translateX(-50%)_scale(1.06)] origin-bottom [filter:drop-shadow(0_16px_16px_rgba(80,40,30,.2))] [transition:transform_.5s_var(--sapil-ease)] group-hover/sb:[transform:translateX(-50%)_scale(1.06)_translateY(-8px)]">
                  <MediaImage src={p.imageUrl as string} alt="" fill sizes="160px" className="!object-contain" />
                </span>
                <span
                  aria-hidden="true"
                  className="absolute end-[2%] bottom-[24%] z-[2] grid place-items-center min-w-[64px] py-[8px] pe-[10px] ps-[20px] bg-sapil-white text-sapil-ink [clip-path:polygon(12px_0,100%_0,100%_100%,12px_100%,0_50%)] [transform:rotate(-10deg)] origin-[0_50%] shadow-[0_8px_18px_-10px_rgba(0,0,0,.3)] text-center leading-[1] before:content-[''] before:absolute before:left-[8px] before:top-1/2 before:w-[6px] before:h-[6px] before:-mt-[3px] before:rounded-full before:bg-sapil-p-pink group-hover/sb:animate-sapil-swing max-900:min-w-[52px] max-900:py-[6px] max-900:pe-[8px] max-900:ps-[16px]"
                >
                  <small className="text-[9px] font-[700] tracking-[.14em]">{p.currency}</small>
                  {" "}
                  <b className="font-sapil-display font-[400] text-[24px] mt-[2px] max-900:text-[19px]">{Math.round(p.price as number)}</b>
                </span>
              </SapilLink>
            ))}
          </div>
        </div>
      </Wrap>
    </HomeSection>
  );
}
