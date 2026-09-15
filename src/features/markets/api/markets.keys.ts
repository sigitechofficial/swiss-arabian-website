export const marketsKeys = {
  all: ["storefront", "markets"] as const,
  list: () => [...marketsKeys.all, "list"] as const,
};
