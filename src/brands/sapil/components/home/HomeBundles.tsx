"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { useAddToCart } from "@/features/cart";
import { useMarketSettings } from "@/features/markets/hooks/useMarketSettings";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, SectionHead, Wrap, cx, tintValue } from "../../ui";
import { ArrowIcon, PlusIcon } from "../shared/icons";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";
import { featuredPriceTier, pastelAt } from "../shell/shellData";
import type { Bundle, HomeProduct } from "./cmsSections";
import { HomeSection } from "./HomeParts";

/** Adds every bottle of a bundle (shared cart hook); the saving is applied in the bag by promotions. */
export function useAddBundle() {
  const { addToCart } = useAddToCart();
  const [added, setAdded] = useState<string | null>(null);
  useEffect(() => {
    if (!added) return;
    const id = window.setTimeout(() => setAdded(null), 1400);
    return () => window.clearTimeout(id);
  }, [added]);
  const add = (key: string, products: HomeProduct[]) => {
    setAdded(key);
    for (const { product: p } of products) {
      if (p.isSellable === false || p.price == null) continue;
      void addToCart({
        sku: p.sku,
        variantId: p.variantId,
        slug: p.slug,
        title: p.title,
        imageUrl: p.imageUrl,
        price: p.price,
        currency: p.currency,
        quantity: 1,
      });
    }
  };
  return { added, add };
}

const sellableAll = (products: HomeProduct[]) =>
  products.length > 0 && products.every(({ product: p }) => p.isSellable !== false && p.price != null);

const BUNDLE_TINTS = ["pink", "peach", "sand", "sand"] as const;

/** v9 `.bundles`: tall pastel cards; the bottles stand together and spread on hover; + adds them all. */
export function HomeBundles({ bundles }: { bundles: Bundle[] }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const headingId = useId();
  const { added, add } = useAddBundle();
  const first = bundles[0];
  return (
    <HomeSection id="bundles" band labelledBy={headingId}>
      <Wrap>
        <SectionHead
          id={headingId}
          eyebrow={t("home.bundlesEyebrow")}
          title={t("home.bundlesTitle")}
          accent={t("home.bundlesAccent")}
          actions={<p className="text-sapil-ink-2 max-w-[46ch] mt-[12px]">{first?.description ?? t("home.bundlesText")}</p>}
        />
        <div className="grid grid-cols-4 gap-[24px] max-900:grid-cols-none max-900:grid-flow-col max-900:auto-cols-[78%] max-900:gap-[14px] max-900:overflow-x-auto max-900:snap-x max-900:snap-mandatory max-900:scroll-px-sapil-gut max-900:[scrollbar-width:none] max-900:-mx-sapil-gut max-900:px-sapil-gut">
          {bundles.map((b, bi) => {
            const n = b.products.length;
            const canAdd = sellableAll(b.products);
            const names = b.products.map((p) => p.product.title).join(" · ");
            return (
              <article
                key={b.id}
                style={{ "--bc": tintValue(BUNDLE_TINTS[bi % BUNDLE_TINTS.length]) } as CSSProperties}
                className="group/b [--sp:19%] hover:[--sp:24%] relative h-[540px] rounded-[32px] bg-[var(--bc)] overflow-hidden p-[24px] flex flex-col justify-between [transition:transform_.5s_var(--sapil-ease)] hover:[transform:translateY(-6px)] max-900:h-[460px] max-900:rounded-[24px] max-900:snap-start"
              >
                <span className="relative z-[2] flex justify-between items-center text-[13px] text-sapil-muted">
                  {b.eyebrow ? (
                    <span className="bg-sapil-white text-sapil-rose font-[700] text-[12px] tracking-[.04em] rounded-full py-[6px] px-[12px]">{b.eyebrow}</span>
                  ) : (
                    <span />
                  )}
                  <span>{t("home.bundleBottles", { count: n })}</span>
                </span>
                <span aria-hidden="true" className="absolute left-[6%] right-[6%] top-[13%] bottom-[36%]">
                  {b.products.map(({ product: p }, i) => {
                    const x = i - (n - 1) / 2;
                    if (!p.imageUrl) return null;
                    return (
                      <span
                        key={p.id}
                        style={{ "--x": x, "--s": Math.abs(x) < 1 ? 1 : 0.86, zIndex: 10 - Math.round(Math.abs(x) * 2) } as CSSProperties}
                        className="absolute bottom-0 left-[calc(50%+var(--x)*var(--sp))] h-[86%] aspect-[1/2] [transform:translateX(-50%)_scale(var(--s))] origin-bottom [filter:drop-shadow(0_16px_16px_rgba(22,20,15,.18))] [transition:left_.6s_var(--sapil-ease),transform_.6s_var(--sapil-ease)] group-hover/b:[transform:translateX(-50%)_scale(var(--s))_translateY(-6px)]"
                      >
                        <MediaImage src={p.imageUrl} alt="" fill sizes="200px" className="!object-contain" />
                      </span>
                    );
                  })}
                </span>
                <div className="relative z-[2]">
                  <span className="block font-sapil-display text-[clamp(30px,2.4vw,38px)] leading-[1]">{b.heading ?? names}</span>
                  <span className="block text-[13px] text-sapil-ink-2 mt-[8px] mb-[16px]">{names}</span>
                  <div className="flex items-center justify-between gap-[12px]">
                    <span className="tabular-nums font-[600] text-[20px]">
                      {b.total != null && b.currency ? price(b.total, b.currency) : null}
                    </span>
                    {canAdd ? (
                      <button
                        type="button"
                        onClick={() => add(b.id, b.products)}
                        aria-label={t("home.bundleAdd", { name: b.heading ?? names })}
                        className={cx(
                          "w-[52px] h-[52px] rounded-full grid place-items-center flex-none shadow-[0_6px_16px_-10px_rgba(0,0,0,.3)] [transition:background_.2s,color_.2s,transform_.3s_var(--sapil-ease)] [&_svg]:w-[22px] [&_svg]:h-[22px]",
                          added === b.id ? "bg-sapil-ok text-sapil-white" : "bg-sapil-white hover:bg-sapil-ink hover:text-sapil-white hover:[transform:rotate(90deg)]",
                        )}
                      >
                        <PlusIcon />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Wrap>
    </HomeSection>
  );
}

/** Hero layout 4, promo (v9 `.hp`): one big bundle offer, plus the price edit and the offer's second link as tiles. */
export function HeroPromo({ bundle }: { bundle: Bundle }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const settings = useMarketSettings();
  const { added, add } = useAddBundle();
  const tier = featuredPriceTier(settings.priceEditTiers);
  const names = bundle.products.map((p) => p.product.title).join(" · ");
  const tiles = [
    tier != null && settings.currencyCode
      ? { key: "price", eyebrow: t("home.promoPriceEyebrow"), title: t("home.underPrice", { amount: price(tier, settings.currencyCode) }), href: `/products?maxPrice=${tier}`, image: bundle.products.at(-1)?.product.imageUrl ?? null }
      : null,
    bundle.secondary
      ? { key: "second", eyebrow: bundle.eyebrow, title: bundle.secondary.label, href: bundle.secondary.href, image: bundle.products[0]?.product.imageUrl ?? null }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);
  return (
    <section aria-label={t("home.heroPromoLabel")} className="pt-[24px] pb-[16px] max-900:pt-[16px] max-900:pb-[8px]">
      <Wrap>
        <div
          className={cx(
            "grid gap-[20px] min-h-[min(640px,calc(100svh-190px))] max-900:grid-cols-1 max-900:min-h-0",
            tiles.length ? "grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : "grid-cols-1",
          )}
        >
          <article className="relative bg-sapil-p-pink rounded-[32px] py-[48px] pe-[48px] ps-[56px] overflow-hidden flex flex-col max-900:pt-[28px] max-900:px-[20px] max-900:pb-[300px] max-900:rounded-[24px]">
            <div className="relative z-[2] max-w-[52%] max-900:max-w-none">
              <p className={EYEBROW}>{bundle.eyebrow ?? t("home.promoEyebrow")}</p>
              <p className="font-sapil-display text-[clamp(48px,5.6vw,92px)] leading-[.98] tracking-[-.01em] mt-[16px] mb-[18px] [text-wrap:balance] max-900:text-[46px]">
                {bundle.heading ?? names}
              </p>
              {bundle.description ? <p className="text-[17px] text-sapil-ink-2 mb-[26px]">{bundle.description}</p> : null}
              <div className="flex gap-[10px] flex-wrap">
                {sellableAll(bundle.products) ? (
                  <Button onClick={() => add(bundle.id, bundle.products)} className={cx(added === bundle.id && "!bg-sapil-ok")}>
                    {bundle.total != null && bundle.currency
                      ? t("home.promoAddPriced", { price: price(bundle.total, bundle.currency) })
                      : t("home.promoAdd")}
                  </Button>
                ) : null}
                {bundle.primary ? (
                  <Button href={bundle.primary.href} variant="line" LinkComponent={SapilLink}>
                    {bundle.primary.label}
                  </Button>
                ) : null}
              </div>
            </div>
            <span aria-hidden="true" className="absolute end-[2%] bottom-0 w-[54%] h-[74%] max-900:w-[92%] max-900:h-[280px] max-900:end-[4%]">
              {bundle.products.slice(0, 4).map(({ product: p }, i) =>
                p.imageUrl ? (
                  <span
                    key={p.id}
                    style={{ "--i": i } as CSSProperties}
                    className="absolute bottom-[-3%] h-[72%] aspect-[1/2] start-[calc(2%+var(--i)*21%)] [transform:rotate(calc((var(--i)-1.5)*5deg))] origin-bottom [filter:drop-shadow(0_22px_20px_rgba(120,40,70,.22))] max-900:h-[62%] max-900:start-[calc(1%+var(--i)*23%)]"
                  >
                    <MediaImage src={p.imageUrl} alt="" fill sizes="240px" preload={i === 0} className="!object-contain" />
                  </span>
                ) : null,
              )}
            </span>
          </article>
          {tiles.length ? (
            <div className="grid grid-rows-[1fr_1fr] gap-[20px] max-900:grid-rows-none">
              {tiles.map((tile, i) => (
                <SapilLink
                  key={tile.key}
                  href={tile.href}
                  style={{ "--c": tintValue(pastelAt(i === 0 ? 2 : 3)) } as CSSProperties}
                  className="group/tile relative flex items-center justify-between gap-[16px] bg-[var(--c)] rounded-[28px] p-[32px] overflow-hidden [transition:transform_.4s_var(--sapil-ease)] hover:[transform:translateY(-4px)] max-900:pt-[22px] max-900:px-[20px] max-900:pb-[80px] max-900:rounded-[22px] max-900:min-h-[190px]"
                >
                  <span>
                    {tile.eyebrow ? <span className={cx(EYEBROW, "block")}>{tile.eyebrow}</span> : null}
                    <b className="block font-sapil-display font-[400] text-[clamp(30px,2.7vw,42px)] leading-[1] mt-[10px] mb-[8px] whitespace-nowrap">{tile.title}</b>
                  </span>
                  {tile.image ? (
                    <span className="relative h-[88%] max-h-[240px] aspect-[1/2] [filter:drop-shadow(0_16px_16px_rgba(22,20,15,.18))] [transition:transform_.5s_var(--sapil-ease)] group-hover/tile:[transform:translateY(-6px)_rotate(-3deg)] max-900:h-[150px]">
                      <MediaImage src={tile.image} alt="" fill sizes="120px" className="!object-contain" />
                    </span>
                  ) : null}
                  <span aria-hidden="true" className="absolute start-[32px] bottom-[26px] w-[44px] h-[44px] rounded-full bg-sapil-white grid place-items-center [&_svg]:w-[18px] [&_svg]:h-[18px] rtl:[&_svg]:[transform:scaleX(-1)] max-900:start-[20px] max-900:bottom-[20px]">
                    <ArrowIcon />
                  </span>
                </SapilLink>
              ))}
            </div>
          ) : null}
        </div>
      </Wrap>
    </section>
  );
}
