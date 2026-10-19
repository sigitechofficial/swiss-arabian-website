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
};
