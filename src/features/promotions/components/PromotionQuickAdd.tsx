"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
import { trackPromotion } from "../utils/promotionAnalytics";

export function PromotionQuickAdd({ surface = "cart" }: { surface?: string }) {
  const { data } = useApplicablePromotions();
  const recommendations = data?.recommendations;
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const [busy, setBusy] = useState<string | null>(null);
  const products = recommendations?.products ?? [];
  if (!recommendations?.heading || products.length === 0) return null;

  return (
    <div className="cart-recs">
      <h3 className="cart-recs-title">{recommendations.heading}</h3>
      <div className="cart-recs-swiper" role="list">
        {products.map((product) => (
          <article className="cart-rec" key={product.sku} role="listitem">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" />
            ) : (
              <span className="cart-rec-ph" aria-hidden="true" />
            )}
            <div className="cart-rec-copy">
              {product.slug ? (
                <Link href={`/products/${product.slug}`} onClick={() => trackPromotion("promotion_recommendation_clicked", {
                  campaignCode: data?.progress?.primary?.campaignCode,
                  mechanic: data?.progress?.primary?.mechanic,
                  market: data?.promotions.context.zoneCode,
                  surface,
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
              aria-label={`${recommendations.addLabel} ${product.title}`}
              onClick={() => {
                if (busy) return;
                setBusy(product.sku);
                void addCartItem({ sku: product.sku, quantity: 1, cartId })
                  .then((cart) => {
                    setCartFromApi(cart);
                    trackPromotion("promotion_recommendation_added", {
                      campaignCode: data?.progress?.primary?.campaignCode,
                      mechanic: data?.progress?.primary?.mechanic,
                      market: data?.promotions.context.zoneCode,
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
  );
}
