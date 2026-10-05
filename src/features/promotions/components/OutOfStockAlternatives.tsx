"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useApiQuery } from "@/lib/api/queryHooks";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchOutOfStock } from "../api/promotions.service";
import { trackPromotion } from "../utils/promotionAnalytics";

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
    <div className="pdp-oos">
      {state.message ? <p className="pdp-oos__message">{state.message}</p> : null}
      {state.heading && state.products.length > 0 ? (
        <div className="cart-recs">
          <h3 className="cart-recs-title">{state.heading}</h3>
          <div className="cart-recs-swiper" role="list">
            {state.products.map((product) => (
              <article className="cart-rec" key={product.sku} role="listitem">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" />
                ) : (
                  <span className="cart-rec-ph" aria-hidden="true" />
                )}
                <div className="cart-rec-copy">
                  {product.slug ? (
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => trackPromotion("promotion_recommendation_clicked", {
                        campaignCode: state.campaignCode,
                        market: zoneCode,
                        surface: "out-of-stock",
                      })}
                    >
                      <p className="cart-rec-name">{product.title}</p>
                    </Link>
                  ) : (
                    <p className="cart-rec-name">{product.title}</p>
                  )}
                  {product.price ? <p className="cart-rec-price">{product.price}</p> : null}
                </div>
                <button
                  type="button"
                  className="cart-rec-add"
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
