/** Market is part of the cache identity so one wallet cannot render as another. */
export const LOYALTY_ACTIVITY_PAGE_SIZE = 20;

export const loyaltyKeys = {
  all: ["loyalty"] as const,
  wallet: (customerId: string, zoneCode: string, currencyCode: string) =>
    [...loyaltyKeys.all, "wallet", customerId, zoneCode, currencyCode] as const,
  transactions: (customerId: string, zoneCode: string, currencyCode: string) =>
    [...loyaltyKeys.all, "transactions", customerId, zoneCode, currencyCode] as const,
  tierHistory: (customerId: string, zoneCode: string, currencyCode: string) =>
    [...loyaltyKeys.all, "tier-history", customerId, zoneCode, currencyCode] as const,
  /** `signature` changes whenever the server quote changes, forcing a refetch. */
  earnPreview: (zoneCode: string, target: string, signature: string) =>
    [...loyaltyKeys.all, "earn-preview", zoneCode, target, signature] as const,
  productEarn: (zoneCode: string, unitPrice: string, quantity: number) =>
    [...loyaltyKeys.all, "product-earn", zoneCode, unitPrice, quantity] as const,
  order: (orderId: string) => [...loyaltyKeys.all, "order", orderId] as const,
};
