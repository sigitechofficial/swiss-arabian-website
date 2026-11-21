"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Plus } from "lucide-react";
import { usePromotionQuickAdd } from "../hooks/usePromotionQuickAdd";
import {
  cartRecPrice,
  cartRecs,
  cartRecsSwiper,
  cartRecsTitle,
} from "@/styles/cartChrome";

export function PromotionQuickAdd({
  surface = "cart",
  holdPosition = false,
}: {
  surface?: string;
  /** Keep the rail where it is on screen while a pick adds a bag line above it. */
  holdPosition?: boolean;
}) {
  // Picks, add, analytics and the drawer scroll hold: shared with every brand.
  const { show, heading, addLabel, products, busy, add, rootRef, trackClick } = usePromotionQuickAdd({ surface, holdPosition });
  if (!show) return null;

  const inDrawer = surface === "drawer";
  return (
    <div className={inDrawer ? cartRecs : "px-0 pt-2 pb-1"} ref={rootRef}>
      <h3
        className={
          inDrawer
            ? cartRecsTitle
            : "mt-0 mb-3 text-[0.72rem] font-semibold tracking-[0.14em] text-[var(--ink,#241f1b)] uppercase"
        }
      >
        {heading}
      </h3>
      <div
        className={
          inDrawer
            ? cartRecsSwiper
            : "flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        }
        role="list"
      >
        {products.map((product) => (
          <article
            className={`relative flex h-[92px] shrink-0 snap-start items-center gap-3 overflow-hidden rounded-xl border border-[rgb(28_25_23/0.1)] bg-white px-3 ${inDrawer ? "w-[calc(100%-2.75rem)]" : "w-[300px]"}`}
            key={product.sku}
            role="listitem"
          >
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f3ebe0]">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="size-full object-contain"
                  src={product.image}
                  alt=""
                />
              ) : null}
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center pe-11">
              {product.slug ? (
                <LocaleLink
                  href={`/products/${product.slug}`}
                  onClick={trackClick}
                >
                  <p className="m-0 line-clamp-2 text-[0.72rem] leading-[1.3] font-medium tracking-[0.03em] text-[var(--ink,#1a1512)] uppercase">
                    {product.title}
                  </p>
                </LocaleLink>
              ) : (
                <p className="m-0 line-clamp-2 text-[0.72rem] leading-[1.3] font-medium tracking-[0.03em] text-[var(--ink,#1a1512)] uppercase">
                  {product.title}
                </p>
              )}
              {product.price ? (
                <p className={cartRecPrice}>{product.price}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="absolute top-1/2 inset-e-3 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[var(--ink,#241f1b)] bg-white p-0 text-[var(--ink,#241f1b)]! hover:bg-[var(--ink,#241f1b)]! hover:text-white! disabled:cursor-wait disabled:opacity-50"
              disabled={busy === product.sku}
              aria-label={`${addLabel} ${product.title}`}
              onClick={() => add(product)}
            >
              <Plus size={14} strokeWidth={1.6} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
