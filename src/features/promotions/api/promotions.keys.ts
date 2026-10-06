export const promotionKeys = {
  all: ["promotions"] as const,
  applicable: (cartId: string, computedAt?: string | null, zoneCode?: string | null) =>
    [...promotionKeys.all, "applicable", cartId, zoneCode ?? "", computedAt ?? ""] as const,
};
