"use client";

import { MediaImage } from "@/components/ui/MediaImage";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { moneyNumber, useOfferShop } from "@/features/promotions/hooks/useOfferShop";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, ProductCard, Serif, SummaryRow, Wrap, cx } from "../../ui";
import { SapilLink, SapilSkeleton, useSapilMoney } from "../../components/commerce/shared";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";

function OfferSkeleton({ label }: { label: string }) {
  return (
    <Wrap as="section" className="w-full pt-[40px] pb-[88px]" aria-busy="true" aria-label={label}>
      <SapilSkeleton className="h-[14px] w-[140px]" />
      <SapilSkeleton className="mt-[18px] h-[72px] w-[60%]" />
      <SapilSkeleton className="mt-[32px] h-[160px] w-full !rounded-[24px]" />
      <div className="mt-[40px] grid grid-cols-4 gap-[24px] max-900:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <SapilSkeleton key={i} className="aspect-[1/1.5] !rounded-[18px] !bg-sapil-p-peach" />
        ))}
      </div>
    </Wrap>
  );
}

/**
 * Sapil's offer link page (/offers/[code]): the bundle builder in the v9
 * system — a tray of steps (one pick per group), the API's price preview and
 * one "add bundle to bag" button, then each group as a v9 product grid.
 * Logic is shared (`useOfferShop`); prices, savings and totals come from the API.
 */
export function SapilOfferPage({ code }: { code: string }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const offer = useOfferShop(code);

  if (offer.status === "loading") return <OfferSkeleton label={t("offers.loading")} />;
  if (offer.status === "error") {
    return (
      <SapilStatePanel
        title={t("offers.errorTitle")}
        accent={t("offers.errorAccent")}
        lead={t("common.loadFailed")}
        actions={<Button onClick={() => window.location.reload()}>{t("common.tryAgain")}</Button>}
      />
    );
  }
  if (offer.status === "missing" || !offer.shop) {
    return (
      <SapilStatePanel
        title={t("offers.missingTitle")}
        accent={t("offers.missingAccent")}
        lead={t("offers.missingLead")}
        actions={
          <Button href="/products" LinkComponent={SapilLink}>
            {t("offers.shopAll")}
          </Button>
        }
      />
    );
  }

  const shop = offer.shop;
  const currency = shop.offer.currencyCode || offer.currency;
  const progress =
    offer.unfilled.length === 0
      ? offer.preview?.message || t("offers.ready")
      : t("offers.toComplete", { groups: offer.unfilled.map((g) => g.name).join(t("offers.joiner")) });

  return (
    <Wrap as="section" className="w-full pt-[40px] pb-[88px] max-900:pt-[24px]">
      <header className="max-w-[760px]">
        <p className={EYEBROW}>{shop.offer.badge || t("offers.eyebrow")}</p>
        <h1 className="font-sapil-display !font-[400] text-[clamp(40px,5vw,72px)] !leading-[1] !tracking-[-.01em] mt-[14px] mb-[16px]">
          {shop.offer.publicTitle ? (
            shop.offer.publicTitle
          ) : (
            <>
              {t("offers.title")} <Serif>{t("offers.accent")}</Serif>
            </>
          )}
        </h1>
        <p className="text-[17px] text-sapil-ink-2 max-w-[52ch]">{shop.offer.shortMessage || t("offers.lead")}</p>
      </header>

      <div className="sticky top-0 z-[20] -mx-sapil-gut mt-[28px] bg-sapil-paper px-sapil-gut py-[12px]">
        <div className="grid items-stretch gap-[16px] grid-cols-[minmax(0,1fr)_320px] max-900:grid-cols-[1fr]">
          <section
            aria-label={t("offers.tray")}
            className="rounded-[24px] bg-[linear-gradient(120deg,var(--sapil-p-pink)_0%,var(--sapil-p-peach)_60%,var(--sapil-p-butter)_100%)] px-[20px] py-[18px]"
          >
            <ol className="list-none flex gap-[12px] overflow-x-auto">
              {shop.groups.map((group, index) => {
                const chosen = offer.selections.find((row) => row.groupId === group.id);
                const product = chosen ? offer.productsBySku.get(`${group.id}:${chosen.sku}`) : undefined;
                const current = offer.activeId === group.id && !chosen;
                const image = product?.image ? resolveCatalogImageUrl(product.image) : "";
                return (
                  <li key={group.id} className="w-[104px] shrink-0">
                    {chosen ? (
                      <div className="relative">
                        <span className="relative grid size-[104px] place-items-center overflow-hidden rounded-[16px] bg-sapil-white">
                          {image ? <MediaImage src={image} alt="" fill sizes="104px" className="object-contain p-[8px]" /> : null}
                        </span>
                        <button
                          type="button"
                          className="absolute top-[6px] end-[6px] grid size-[24px] place-items-center rounded-full bg-sapil-white text-sapil-ink shadow-sapil hover:text-sapil-sale"
                          aria-label={t("offers.remove", { name: product?.title ?? chosen.sku })}
                          onClick={() => offer.removeSelection(group.id, chosen.sku)}
                        >
                          <svg viewBox="0 0 20 20" className="size-[10px]" fill="none" aria-hidden="true">
                            <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <a
                        href={`#offer-group-${group.id}`}
                        className={cx(
                          "grid size-[104px] place-items-center rounded-[16px] border-2 border-dashed bg-sapil-white/60 text-sapil-muted",
                          current ? "border-sapil-accent text-sapil-accent" : "border-sapil-line-2",
                        )}
                      >
                        <span className="sr-only">{t("offers.choose", { group: group.name })}</span>
                        <svg viewBox="0 0 20 20" className="size-[20px]" fill="none" aria-hidden="true">
                          <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      </a>
                    )}
                    <p className="mt-[8px] text-center text-[12px] leading-[1.3] line-clamp-2" aria-hidden={!chosen}>
                      {product?.title ?? t("offers.step", { number: index + 1 })}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
          <aside className="flex flex-col rounded-[24px] bg-sapil-white p-[20px] shadow-sapil" aria-live="polite">
            {offer.subtotal != null && offer.total != null ? (
              <>
                <SummaryRow label={t("offers.initial")} value={<span dir="ltr">{money(offer.subtotal, currency)}</span>} />
                {offer.savings != null && offer.savings > 0 ? (
                  <SummaryRow
                    variant="save"
                    label={shop.offer.badge || t("offers.saving")}
                    value={<span dir="ltr">−{money(offer.savings, currency)}</span>}
                  />
                ) : (
                  <p className="text-[13px] text-sapil-ink-2">{progress}</p>
                )}
                <SummaryRow variant="total" label={t("offers.total")} value={<span dir="ltr">{money(offer.total, currency)}</span>} />
              </>
            ) : (
              <p className="text-[14px] text-sapil-ink-2 mb-[12px]">{progress}</p>
            )}
            {offer.addFailed ? (
              <p role="alert" className="text-[13px] text-sapil-sale mb-[8px]">
                {t("offers.addFailed")}
              </p>
            ) : null}
            <Button className="mt-auto w-full" disabled={!offer.ready} onClick={() => void offer.addSelected()}>
              {offer.adding ? t("offers.adding") : t("offers.addAll")}
            </Button>
          </aside>
        </div>
      </div>

      <div className="mt-[40px] flex flex-col gap-[56px]">
        {shop.groups.map((group, index) => {
          const full = offer.groupFilled(group);
          return (
            <section
              key={group.id}
              id={`offer-group-${group.id}`}
              aria-labelledby={`offer-group-${group.id}-title`}
              className="scroll-mt-[260px] max-900:scroll-mt-[340px]"
            >
              <p className={EYEBROW}>{full ? t("offers.full") : t("offers.step", { number: index + 1 })}</p>
              <h2
                id={`offer-group-${group.id}-title`}
                className="font-sapil-sans font-[700] text-[28px] leading-[1.15] tracking-[-.02em] mt-[8px] mb-[20px]"
              >
                {group.name}
              </h2>
              <ul className="list-none grid grid-cols-4 gap-x-[24px] gap-y-[36px] max-900:grid-cols-2 max-900:gap-x-[12px]">
                {group.products.map((product) => {
                  const selected = offer.isSelected(group.id, product.sku);
                  const disabled = !product.inStock || (full && !selected);
                  const amount = moneyNumber(product.amount);
                  const price = amount == null ? product.price : money(amount, currency);
                  return (
                    <li key={product.sku} className="flex min-w-0 flex-col">
                      <ProductCard
                        name={product.title}
                        href={product.slug ? `/products/${product.slug}` : `#offer-group-${group.id}`}
                        image={product.image ? resolveCatalogImageUrl(product.image) : ""}
                        imageAlt=""
                        tile="sand"
                        price={price ? <span dir="ltr">{price}</span> : ""}
                        badge={product.inStock ? undefined : t("offers.soldOut")}
                        headingLevel="h3"
                        LinkComponent={SapilLink}
                      />
                      <Button
                        variant="add"
                        done={selected}
                        className="mt-[12px] w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() =>
                          selected ? offer.removeSelection(group.id, product.sku) : offer.choose(group, product)
                        }
                      >
                        {!product.inStock ? t("offers.soldOut") : selected ? t("offers.added") : t("offers.add")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </Wrap>
  );
}
