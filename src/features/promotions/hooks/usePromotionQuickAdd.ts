"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { trackPromotion } from "../utils/promotionAnalytics";
import { useApplicablePromotions } from "./useApplicablePromotions";

/** How long after a pick lands the rail keeps its place while the bag settles. */
const HOLD_SETTLE_MS = 1500;

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return null;
}

/**
 * The bag's "add this to unlock the next reward" picks, shared by every brand
 * (each draws its own rail): the server's recommendations, one-tap add to the
 * bag, analytics, and, in a scrolling drawer, keeping the rail under the
 * shopper's finger while the new line appears above it. `rootRef` goes on the
 * rail's outer element.
 */
export function usePromotionQuickAdd({ surface = "cart", holdPosition = false }: { surface?: string; holdPosition?: boolean } = {}) {
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
  const tracking = {
    campaignCode: data?.progress?.primary?.campaignCode,
    mechanic: data?.progress?.primary?.mechanic,
    market: data?.promotions.context.zoneCode,
    surface,
  };

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
        trackPromotion("promotion_recommendation_added", tracking);
      })
      .finally(() => {
        setBusy(null);
        if (holdRef.current) holdRef.current.until = performance.now() + HOLD_SETTLE_MS;
      });
  };

  return {
    /** No heading or no products: show nothing. */
    show: Boolean(recommendations?.heading) && products.length > 0,
    heading: recommendations?.heading ?? "",
    addLabel: recommendations?.addLabel ?? "",
    products,
    busy,
    add,
    rootRef,
    /** For a product link in the rail. */
    trackClick: () => trackPromotion("promotion_recommendation_clicked", tracking),
  };
}
