"use client";

import { toast } from "@/components/ui/Toaster";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useState } from "react";
import { addCartItem } from "@/features/cart/api/cart.service";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchEmptyBag } from "../api/promotions.service";
import type { EmptyBagGroup, EmptyBagProduct } from "../types/emptyBag";
import { readEmptyOrigin, readViewed } from "../utils/emptyBagMemory";
import { trackPromotion } from "../utils/promotionAnalytics";

/** Server headings arrive as sentences ("Recently viewed."); a rail title drops the stop. */
export function railHeading(heading: string): string {
  return heading.trim().replace(/[.。]+$/, "");
}

/**
 * Suggestions for an empty bag, shared by every brand (each draws its own
 * rails): the campaign the shopper came from, recently viewed and best sellers
 * as the server groups them; one-tap add (opens the bag) and analytics.
 */
export function useEmptyBagRecovery(surface = "empty-cart") {
  const t = useShopCopy();
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const [busy, setBusy] = useState<string | null>(null);
  const query = useApiQuery(
    ["promotions", "empty-bag", zoneCode],
    () => fetchEmptyBag({ campaignCode: readEmptyOrigin(zoneCode), viewedProductIds: readViewed() }),
    { staleTime: 30_000 },
  );
  const bag = query.data;

  const add = (group: EmptyBagGroup, product: EmptyBagProduct) => {
    if (busy) return;
    setBusy(product.sku);
    void addCartItem({ sku: product.sku, quantity: 1, cartId })
      .then((cart) => {
        setCartFromApi(cart);
        setCartOpen(true);
        trackPromotion("promotion_recommendation_added", { campaignCode: group.campaignCode, market: zoneCode, surface });
      })
      .catch(() => toast(t("promotions.addFailed"), "error"))
      .finally(() => setBusy(null));
  };

  return {
    groups: bag?.groups ?? [],
    addLabel: bag?.addLabel ?? "",
    busy,
    add,
    trackClick: (group: EmptyBagGroup) =>
      trackPromotion("promotion_recommendation_clicked", { campaignCode: group.campaignCode, market: zoneCode, surface }),
  };
}
