export const promotionKeys = {
  all: ["promotions"] as const,
  applicable: (cartId: string, computedAt?: string | null) =>
    [...promotionKeys.all, "applicable", cartId, computedAt ?? ""] as const,
};
