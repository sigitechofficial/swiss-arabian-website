"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Plus } from "lucide-react";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
import { trackPromotion } from "../utils/promotionAnalytics";
import {
  cartRecPrice,
  cartRecs,
  cartRecsSwiper,
  cartRecsTitle,
  emptyBagAdd,
  emptyBagCard,
  emptyBagName,
  emptyBagPh,
} from "@/styles/cartChrome";

/** How long after a pick lands the rail keeps its place while the bag settles. */
const HOLD_SETTLE_MS = 1500;

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return null;
}

export function PromotionQuickAdd({
  surface = "cart",
  holdPosition = false,
}: {
  surface?: string;
  /** Keep the rail where it is on screen while a pick adds a bag line above it. */
  holdPosition?: boolean;
}) {
  const { data } = useApplicablePromotions();
  const recommendations = data?.recommendations;
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const [busy, setBusy] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<{ top: number; until: number } | null>(null);
  // Subscribed so the hold below runs in the same commit that grows the bag.
  useCartStore((state) => state.lines);
  useCartStore((state) => state.promotions);

  // A pick adds a line, a badge or a gift above this rail and pushes it out from
  // under the shopper's finger. Put it back before the browser paints.
  useLayoutEffect(() => {
    const hold = holdRef.current;
    const root = rootRef.current;
    if (!hold || !root) return;
    if (performance.now() > hold.until) {
      holdRef.current = null;
      return;
    }
    const scroller = scrollParent(root);
    if (!scroller) return;
    const shift = root.getBoundingClientRect().top - hold.top;
    if (Math.abs(shift) >= 1) scroller.scrollTop += shift;
  });

  const products = recommendations?.products ?? [];
  if (!recommendations?.heading || products.length === 0) return null;

  const add = (product: (typeof products)[number]) => {
    if (busy) return;
    setBusy(product.sku);
    const root = rootRef.current;
    const scroller = holdPosition && root ? scrollParent(root) : null;
    if (root && scroller) {
      holdRef.current = { top: root.getBoundingClientRect().top, until: Number.POSITIVE_INFINITY };
      // The shopper scrolling on their own ends the hold.
      const release = () => {
        holdRef.current = null;
      };
      scroller.addEventListener("wheel", release, { once: true, passive: true });
      scroller.addEventListener("touchmove", release, { once: true, passive: true });
    }
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
      .finally(() => {
        setBusy(null);
        if (holdRef.current) holdRef.current.until = performance.now() + HOLD_SETTLE_MS;
      });
  };

  return (
    <div className={cartRecs} ref={rootRef}>
      <h3 className={cartRecsTitle}>{recommendations.heading}</h3>
      <div className={cartRecsSwiper} role="list">
        {products.map((product) => (
          <article className={emptyBagCard} key={product.sku} role="listitem">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" />
            ) : (
              <span className={emptyBagPh} aria-hidden="true" />
            )}
            <div className="flex min-w-0 flex-col pr-10">
              {product.slug ? (
                <LocaleLink href={`/products/${product.slug}`} onClick={() => trackPromotion("promotion_recommendation_clicked", {
                  campaignCode: data?.progress?.primary?.campaignCode,
                  mechanic: data?.progress?.primary?.mechanic,
                  market: data?.promotions.context.zoneCode,
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
              aria-label={`${recommendations.addLabel} ${product.title}`}
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
