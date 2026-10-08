"use client";

import { useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Plus } from "lucide-react";
import { useApiQuery } from "@/lib/api/queryHooks";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchOutOfStock } from "../api/promotions.service";
import { trackPromotion } from "../utils/promotionAnalytics";
import {
  pdpOos,
  pdpOosMessage,
} from "@/styles/pdpChrome";
import {
  cartRec,
  cartRecAdd,
  cartRecCopy,
  cartRecName,
  cartRecPh,
  cartRecPrice,
  cartRecs,
  cartRecsSwiper,
  cartRecsTitle,
} from "@/styles/cartChrome";

export function OutOfStockAlternatives({ productId }: { productId: string }) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const [busy, setBusy] = useState<string | null>(null);
  const query = useApiQuery(
    ["promotions", "out-of-stock", zoneCode, productId],
    () => fetchOutOfStock(productId),
    { staleTime: 30_000, enabled: Boolean(productId) },
  );
  const state = query.data;
  if (!state?.outOfStock) return null;

  return (
    <div className={pdpOos}>
      {state.message ? <p className={pdpOosMessage}>{state.message}</p> : null}
      {state.heading && state.products.length > 0 ? (
        <div className={cartRecs}>
          <h3 className={cartRecsTitle}>{state.heading}</h3>
          <div className={cartRecsSwiper} role="list">
            {state.products.map((product) => (
              <article className={cartRec} key={product.sku} role="listitem">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" />
                ) : (
                  <span className={cartRecPh} aria-hidden="true" />
                )}
                <div className={cartRecCopy}>
                  {product.slug ? (
                    <LocaleLink
                      href={`/products/${product.slug}`}
                      onClick={() => trackPromotion("promotion_recommendation_clicked", {
                        campaignCode: state.campaignCode,
                        market: zoneCode,
                        surface: "out-of-stock",
                      })}
                    >
                      <p className={cartRecName}>{product.title}</p>
                    </LocaleLink>
                  ) : (
                    <p className={cartRecName}>{product.title}</p>
                  )}
                  {product.price ? <p className={cartRecPrice}>{product.price}</p> : null}
                </div>
                <button
                  type="button"
                  className={cartRecAdd}
                  disabled={busy === product.sku}
                  aria-label={`${state.addLabel} ${product.title}`}
                  onClick={() => {
                    if (busy) return;
                    setBusy(product.sku);
                    void addCartItem({ sku: product.sku, quantity: 1, cartId })
                      .then((cart) => {
                        setCartFromApi(cart);
                        setCartOpen(true);
                        trackPromotion("promotion_recommendation_added", {
                          campaignCode: state.campaignCode,
                          market: zoneCode,
                          surface: "out-of-stock",
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
      ) : null}
    </div>
  );
}
