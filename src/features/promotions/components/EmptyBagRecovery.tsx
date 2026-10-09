"use client";

import { useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Plus } from "lucide-react";
import { useApiQuery } from "@/lib/api/queryHooks";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchEmptyBag } from "../api/promotions.service";
import { readEmptyOrigin, readViewed } from "../utils/emptyBagMemory";
import { trackPromotion } from "../utils/promotionAnalytics";
import {
  cartRecPh,
  cartRecPrice,
  cartRecs,
  cartRecsSwiper,
  cartRecsTitle,
  emptyBagAdd,
  emptyBagCard,
  emptyBagCardFit,
  emptyBagName,
} from "@/styles/cartChrome";

/** Server headings arrive as sentences ("Recently viewed."); the uppercase rail title drops the stop. */
function railHeading(heading: string): string {
  return heading.trim().replace(/[.。]+$/, "");
}

export function EmptyBagRecovery({
  surface = "empty-cart",
  fit = false,
}: {
  surface?: string;
  /** Bag drawer: size cards so two fit across instead of clipping the second. */
  fit?: boolean;
}) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const [busy, setBusy] = useState<string | null>(null);
  const query = useApiQuery(
    ["promotions", "empty-bag", zoneCode],
    () => fetchEmptyBag({
      campaignCode: readEmptyOrigin(zoneCode),
      viewedProductIds: readViewed(),
    }),
    { staleTime: 30_000 },
  );
  const bag = query.data;
  if (!bag || bag.groups.length === 0) return null;

  return (
    <>
      {bag.groups.map((group) => (
        <div className={cartRecs} key={group.id || group.heading}>
          <h3 className={cartRecsTitle}>{railHeading(group.heading)}</h3>
          <div className={cartRecsSwiper} role="list">
            {group.products.map((product) => (
              <article className={fit ? `${emptyBagCard} ${emptyBagCardFit}` : emptyBagCard} key={`${group.id}-${product.sku}`} role="listitem">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" />
                ) : (
                  <span className={`${cartRecPh} size-[72px] rounded-lg`} aria-hidden="true" />
                )}
                <div className="flex min-w-0 flex-col pr-10">
                  {product.slug ? (
                    <LocaleLink
                      href={`/products/${product.slug}`}
                      onClick={() => trackPromotion("promotion_recommendation_clicked", {
                        campaignCode: group.campaignCode,
                        market: zoneCode,
                        surface,
                      })}
                    >
                      <p className={emptyBagName}>{product.title}</p>
                    </LocaleLink>
                  ) : (
                    <p className={emptyBagName}>{product.title}</p>
                  )}
                  {product.price ? <p className={cartRecPrice}>{product.price}</p> : null}
                </div>
                <button
                  type="button"
                  className={emptyBagAdd}
                  disabled={busy === product.sku}
                  aria-label={`${bag.addLabel} ${product.title}`}
                  onClick={() => {
                    if (busy) return;
                    setBusy(product.sku);
                    void addCartItem({ sku: product.sku, quantity: 1, cartId })
                      .then((cart) => {
                        setCartFromApi(cart);
                        setCartOpen(true);
                        trackPromotion("promotion_recommendation_added", {
                          campaignCode: group.campaignCode,
                          market: zoneCode,
                          surface,
                        });
                      })
                      .finally(() => setBusy(null));
                  }}
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
