/** `data.shippingPromise` on PDP only — listing cards do not include this. */
export type StorefrontShippingPromise = {
  zoneDeliveryMethodId: string;
  partnerCode: string;
  methodCode: string;
  displayName: string;
  isDefault: boolean;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
  currencyCode: string;
  baseDeliveryFee: string | null;
  freeDeliveryThreshold: string | null;
};
