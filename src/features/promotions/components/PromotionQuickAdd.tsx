"use client";

import { useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Plus } from "lucide-react";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
import { trackPromotion } from "../utils/promotionAnalytics";
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

export function PromotionQuickAdd({ surface = "cart" }: { surface?: string }) {
  const { data } = useApplicablePromotions();
  const recommendations = data?.recommendations;
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const [busy, setBusy] = useState<string | null>(null);
  const products = recommendations?.products ?? [];
  if (!recommendations?.heading || products.length === 0) return null;

  return (
    <div className={cartRecs}>
      <h3 className={cartRecsTitle}>{recommendations.heading}</h3>
      <div className={cartRecsSwiper} role="list">
        {products.map((product) => (
          <article className={cartRec} key={product.sku} role="listitem">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" />
            ) : (
              <span className={cartRecPh} aria-hidden="true" />
            )}
            <div className={cartRecCopy}>
              {product.slug ? (
                <LocaleLink href={`/products/${product.slug}`} onClick={() => trackPromotion("promotion_recommendation_clicked", {
                  campaignCode: data?.progress?.primary?.campaignCode,
                  mechanic: data?.progress?.primary?.mechanic,
                  market: data?.promotions.context.zoneCode,
                  surface,
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
