"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Plus } from "lucide-react";
import { railHeading, useEmptyBagRecovery } from "../hooks/useEmptyBagRecovery";
import {
  cartRecPrice,
  cartRecs,
  cartRecsSwiper,
  cartRecsTitle,
  emptyBagAdd,
  emptyBagCard,
  emptyBagCardFit,
  emptyBagName,
  emptyBagPh,
} from "@/styles/cartChrome";

export function EmptyBagRecovery({
  surface = "empty-cart",
  fit = false,
}: {
  surface?: string;
  /** Bag drawer: size cards so two fit across instead of clipping the second. */
  fit?: boolean;
}) {
  // Suggestions, add and analytics: shared with every brand.
  const { groups, addLabel, busy, add, trackClick } = useEmptyBagRecovery(surface);
  if (groups.length === 0) return null;
  return (
    <>
      {groups.map((group) => (
        <div className={cartRecs} key={group.id || group.heading}>
          <h3 className={cartRecsTitle}>{railHeading(group.heading)}</h3>
          <div className={cartRecsSwiper} role="list">
            {group.products.map((product) => (
              <article
                className={
                  fit ? `${emptyBagCard} ${emptyBagCardFit}` : emptyBagCard
                }
                key={`${group.id}-${product.sku}`}
                role="listitem"
              >
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" />
                ) : (
                  <span className={emptyBagPh} aria-hidden="true" />
                )}
                <div className="flex min-w-0 flex-col pr-10">
                  {product.slug ? (
                    <LocaleLink
                      href={`/products/${product.slug}`}
                      onClick={() => trackClick(group)}
                    >
                      <p className={emptyBagName}>{product.title}</p>
                    </LocaleLink>
                  ) : (
                    <p className={emptyBagName}>{product.title}</p>
                  )}
                  {product.price ? (
                    <p className={cartRecPrice}>{product.price}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={emptyBagAdd}
                  disabled={busy === product.sku}
                  aria-label={`${addLabel} ${product.title}`}
                  onClick={() => add(group, product)}
                >
                  <Plus size={14} strokeWidth={1.6} />
                </button>
              </article>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
