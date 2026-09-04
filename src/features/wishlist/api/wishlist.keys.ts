export const wishlistKeys = {
  all: ["wishlist"] as const,
  lists: () => [...wishlistKeys.all, "list"] as const,
  list: (zoneCode: string, limit: number, offset: number) =>
    [...wishlistKeys.lists(), zoneCode, limit, offset] as const,
  statuses: () => [...wishlistKeys.all, "status"] as const,
  status: (productIds: string[]) =>
    [...wishlistKeys.statuses(), productIds.join(",")] as const,
};
