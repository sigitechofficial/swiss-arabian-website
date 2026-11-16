"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { MediaImage } from "@/components/ui/MediaImage";
import { offerProductPrice as productPrice, useOfferShop } from "../hooks/useOfferShop";

/** Swiss Arabian's offer link page (/offers/[code]); logic in `useOfferShop`. */
export function OfferShop({ code }: { code: string }) {
  const t = useShopCopy();
  const offer = useOfferShop(code);
  if (offer.status === "loading") return <p>Loading.</p>;
  if (offer.status === "error") return <p>We could not load this page.</p>;
  if (offer.status === "missing" || !offer.shop) return <p>This is not available in your market.</p>;
  const shop = offer.shop;
  const {
    selections,
    productsBySku,
    currency,
    choose,
    removeSelection,
    addSelected,
    groupFilled,
    unfilled,
    activeId,
    ready,
    subtotal,
    savings,
    total,
    preview,
  } = offer;
  const addError = offer.addFailed ? shop.copy.add : null;
  const addPiece = t("bundle.add");
  const addedPiece = t("bundle.added");
  const soldOut = shop.copy.soldOut || t("bundle.soldOut");
  const progress =
    unfilled.length === 0
      ? preview?.message || t("bundle.ready")
      : t("bundle.addToComplete", {
          groups: unfilled.map((group) => group.name).join(t("bundle.listJoiner")),
        });

  return (
    <article className="flex w-full min-w-0 flex-col pb-16">
      <div className="bundle-dock sticky z-30 -mx-[var(--chrome-edge,1rem)] bg-[var(--cream,#faf6ee)] px-[var(--chrome-edge,1rem)] py-3 min-[1200px]:mx-0 min-[1200px]:px-0">
        <div className="grid items-stretch gap-3 min-[900px]:grid-cols-[minmax(0,1fr)_272px]">
          <div className="rounded-2xl bg-[#f3ece4] px-5 py-4">
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h1 className="m-0 shrink-0 font-[family-name:var(--font-display)] text-[2rem] leading-none font-medium tracking-[-0.03em] text-[#1a1a1a]">
                {t("bundle.title")}
              </h1>
              <p className="m-0 text-[0.95rem] text-[#5e5852]">
                {t("bundle.subtitle")}
              </p>
            </header>
            <section aria-label={shop.copy.tray}>
              <ol className="m-0 mt-3.5 flex list-none gap-3 p-0">
                {shop.groups.map((group) => {
                  const chosen = selections.find(
                    (row) => row.groupId === group.id,
                  );
                  const product = chosen
                    ? productsBySku.get(`${group.id}:${chosen.sku}`)
                    : undefined;
                  const current = activeId === group.id && !chosen;
                  return (
                    <li key={group.id} className="w-[7.25rem] shrink-0">
                      {chosen ? (
                        <div className="relative">
                          <span className="grid size-[7.25rem] place-items-center overflow-hidden rounded-xl bg-[#faf7f2]">
                            {product?.image ? (
                              <MediaImage
                                className="h-full w-full object-contain p-1.5"
                                src={product.image}
                                alt=""
                                width={96}
                                height={96}
                              />
                            ) : null}
                          </span>
                          <button
                            type="button"
                            className="absolute top-1 end-1 grid size-5 cursor-pointer place-items-center rounded-full border-0 bg-white/90 p-0 text-[#1c1917]"
                            aria-label={`${shop.copy.remove} ${product?.title ?? chosen.sku}`}
                            onClick={() =>
                              removeSelection(group.id, chosen.sku)
                            }
                          >
                            <svg
                              viewBox="0 0 20 20"
                              className="size-2.5"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M5 5l10 10M15 5 5 15"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <a
                          href={`#offer-group-${group.id}`}
                          className="block text-inherit no-underline"
                        >
                          <span
                            className={`grid size-[7.25rem] place-items-center rounded-xl border border-dashed bg-[#faf7f2] text-[#b9aea2] ${current ? "border-[#c4b5a6]" : "border-[#ddd2c6]"}`}
                          >
                            <svg
                              viewBox="0 0 20 20"
                              className="size-5"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M10 4.5v11M4.5 10h11"
                                stroke="currentColor"
                                strokeWidth="1.4"
                              />
                            </svg>
                          </span>
                        </a>
                      )}
                      <p className="m-0 mt-2 line-clamp-2 text-center text-[0.78rem] leading-snug text-[#3d3834]">
                        {product?.title ?? `${shop.copy.choose} ${group.name}`}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
          <aside className="flex flex-col rounded-2xl bg-[#f6f1eb] px-4 pt-4 pb-3.5">
            {subtotal != null && total != null ? (
              <>
                <div className="flex items-baseline justify-between gap-3 text-[0.82rem] text-[#6a625b]">
                  <span>{t("bundle.initialPrice")}</span>
                  <span dir="ltr">{formatMoney(subtotal, currency)}</span>
                </div>
                {savings != null && savings > 0 ? (
                  <div className="mt-2 flex items-baseline justify-between gap-3 text-[0.82rem] font-medium text-copper">
                    <span>
                      {shop.offer.badge || shop.copy.saving || "Discount"}
                    </span>
                    <span dir="ltr">−{formatMoney(savings, currency)}</span>
                  </div>
                ) : (
                  <p className="m-0 mt-2 text-[0.8rem] leading-snug text-[#6f675f]">
                    {progress}
                  </p>
                )}
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#e6dcd2] pt-3 text-[0.95rem] font-semibold tracking-[0.04em] text-[#1c1917] uppercase">
                  <span>{t("bundle.total")}</span>
                  <span dir="ltr">{formatMoney(total, currency)}</span>
                </div>
              </>
            ) : (
              <p className="m-0 text-[0.85rem] leading-snug text-[#6f675f]">
                {progress}
              </p>
            )}
            {addError ? (
              <p className="m-0 mt-2 text-[0.8rem] text-copper" role="alert">
                {addError}
              </p>
            ) : null}
            <button
              className={`mt-3 flex min-h-11 w-full items-center justify-center rounded-full border-0 px-4 text-[0.8rem] font-semibold tracking-[0.08em] text-white uppercase ${ready ? "cursor-pointer bg-copper hover:bg-copper-deep" : "cursor-not-allowed bg-[#e7b2a8]"}`}
              type="button"
              disabled={!ready}
              onClick={addSelected}
            >
              {shop.copy.add}
            </button>
          </aside>
        </div>
      </div>

      <div className="mt-8 flex min-w-0 flex-col gap-12">
        {shop.groups.map((group) => {
          const full = groupFilled(group);
          return (
            <section
              key={group.id}
              id={`offer-group-${group.id}`}
              aria-label={group.name}
              className="scroll-mt-[calc(var(--site-header-h,9.25rem)+260px)]"
            >
              <h2 className="m-0 font-[family-name:var(--font-display)] text-[1.35rem] font-normal text-[#2a201a]">
                {group.name}
              </h2>
              <ul
                className="m-0 mt-5 grid list-none grid-cols-2 gap-x-3 gap-y-8 p-0 min-[900px]:grid-cols-4"
                role="list"
              >
                {group.products.map((product) => {
                  const selected = selections.some(
                    (row) =>
                      row.groupId === group.id && row.sku === product.sku,
                  );
                  const locked = full && !selected;
                  const disabled = !product.inStock || locked;
                  const label = !product.inStock
                    ? soldOut
                    : selected
                      ? addedPiece
                      : addPiece;
                  return (
                    <li key={product.sku} className="flex min-w-0 flex-col">
                      {product.slug ? (
                        <LocaleLink
                          className="text-inherit no-underline"
                          href={`/products/${product.slug}`}
                        >
                          <span className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white">
                            {product.image ? (
                              <MediaImage
                                className="h-full w-full object-contain p-3"
                                src={product.image}
                                alt=""
                                width={240}
                                height={240}
                              />
                            ) : null}
                          </span>
                          <span className="mt-2.5 line-clamp-2 text-[0.82rem] leading-snug text-[#2a201a]">
                            {product.title}
                          </span>
                        </LocaleLink>
                      ) : (
                        <div>
                          <span className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white">
                            {product.image ? (
                              <MediaImage
                                className="h-full w-full object-contain p-3"
                                src={product.image}
                                alt=""
                                width={240}
                                height={240}
                              />
                            ) : null}
                          </span>
                          <span className="mt-2.5 line-clamp-2 block text-[0.82rem] leading-snug text-[#2a201a]">
                            {product.title}
                          </span>
                        </div>
                      )}
                      <div className="mt-auto">
                        {productPrice(product, currency) ? (
                          <p className="m-0 mt-2 text-[0.82rem] font-semibold text-copper">
                            {productPrice(product, currency)}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className={`mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full px-3 text-[0.72rem] font-semibold tracking-[0.06em] uppercase ${
                            selected
                              ? "cursor-pointer border border-copper bg-white text-copper"
                              : disabled
                                ? "cursor-not-allowed border-0 bg-[#efe6dc] text-[#b3a496]"
                                : "cursor-pointer border-0 bg-copper text-white hover:bg-copper-deep"
                          }`}
                          aria-pressed={selected}
                          disabled={disabled}
                          onClick={() =>
                            selected
                              ? removeSelection(group.id, product.sku)
                              : choose(group, product)
                          }
                        >
                          {label}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
}
