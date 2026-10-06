export type PromotionEventName =
  | "promotion_impression"
  | "promotion_details_opened"
  | "shop_offer_clicked"
  | "promotion_builder_opened"
  | "promotion_product_selected"
  | "promotion_product_removed"
  | "promotion_multi_add"
  | "promotion_progress_advanced"
  | "promotion_unlocked"
  | "promotion_recommendation_clicked"
  | "promotion_recommendation_added"
  | "promotion_checkout_started"
  | "promotion_order_completed";

/**
 * cart_abandoned is an analytics catalog name and is not emitted anywhere.
 * It stays deferred: abandonment needs a server idle sweep, not a page event.
 */

export function trackPromotion(
  name: PromotionEventName,
  detail: {
    campaignId?: string | null;
    campaignCode?: string | null;
    mechanic?: string | null;
    market?: string | null;
    brand?: string | null;
    surface: string;
  },
) {
  if (typeof window === "undefined") return;
  const payload = {
    name,
    campaignId: detail.campaignId ?? null,
    campaignCode: detail.campaignCode ?? null,
    mechanic: detail.mechanic ?? null,
    market: detail.market ?? null,
    brand: detail.brand ?? null,
    surface: detail.surface,
  };
  window.dispatchEvent(new CustomEvent("swiss-promotion", { detail: payload }));
}
