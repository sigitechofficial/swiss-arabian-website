export const promotionKeys = {
  all: ["promotions"] as const,
  applicable: (
    cartId: string,
    computedAt?: string | null,
    zoneCode?: string | null,
    customerId?: string | null,
  ) =>
    [
      ...promotionKeys.all,
      "applicable",
      cartId,
      zoneCode ?? "",
      customerId ?? "guest",
      computedAt ?? "",
    ] as const,
  discovery: (zoneCode: string | null, customerId: string | null, productKey: string) =>
    [...promotionKeys.all, "discovery", zoneCode ?? "", customerId ?? "guest", productKey] as const,
  /** Public offer builder page (/offers/[code]). */
  offerShop: (code: string, zoneCode: string, locale: string) =>
    [...promotionKeys.all, "offer-shop", code, zoneCode, locale] as const,
};
