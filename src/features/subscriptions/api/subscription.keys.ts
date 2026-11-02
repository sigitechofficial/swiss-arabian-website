export const subscriptionKeys = {
  plans: (zoneCode: string) => ["subscriptions", "plans", zoneCode] as const,
  plan: (planCode: string, zoneCode: string) =>
    ["subscriptions", "plan", planCode, zoneCode] as const,
  products: (planCode: string, zoneCode: string, audience = "") =>
    ["subscriptions", "products", planCode, zoneCode, audience] as const,
  consent: (zoneCode: string, brandCode = "") =>
    ["subscriptions", "consent", brandCode, zoneCode] as const,
  mine: (zoneCode: string) => ["subscriptions", "mine", zoneCode] as const,
  detail: (id: string, zoneCode: string) => ["subscriptions", "detail", id, zoneCode] as const,
};
