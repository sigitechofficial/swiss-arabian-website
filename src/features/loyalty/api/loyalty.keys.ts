/** Market is part of the cache identity so one wallet cannot render as another. */
export const loyaltyKeys = {
  all: ["loyalty"] as const,
  wallet: (zoneCode: string, currencyCode: string) =>
    [...loyaltyKeys.all, "wallet", zoneCode, currencyCode] as const,
  transactions: (zoneCode: string, currencyCode: string) =>
    [...loyaltyKeys.all, "transactions", zoneCode, currencyCode] as const,
  tierHistory: (zoneCode: string, currencyCode: string) =>
    [...loyaltyKeys.all, "tier-history", zoneCode, currencyCode] as const,
  /** `signature` changes whenever the server quote changes, forcing a refetch. */
  earnPreview: (zoneCode: string, target: string, signature: string) =>
    [...loyaltyKeys.all, "earn-preview", zoneCode, target, signature] as const,
  productEarn: (zoneCode: string, unitPrice: string, quantity: number) =>
    [...loyaltyKeys.all, "product-earn", zoneCode, unitPrice, quantity] as const,
  order: (orderId: string) => [...loyaltyKeys.all, "order", orderId] as const,
};
