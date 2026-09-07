import type { ReviewSort } from "../types/reviews";

export const reviewsKeys = {
  all: ["reviews"] as const,
  public: () => [...reviewsKeys.all, "public"] as const,
  summary: (productKey: string, zoneCode?: string | null) =>
    [...reviewsKeys.public(), "summary", productKey, zoneCode ?? "default"] as const,
  list: (
    productKey: string,
    zoneCode?: string | null,
    sort: ReviewSort = "newest",
    offset = 0,
  ) =>
    [
      ...reviewsKeys.public(),
      "list",
      productKey,
      zoneCode ?? "default",
      sort,
      offset,
    ] as const,
  infinite: (
    productKey: string,
    zoneCode?: string | null,
    sort: ReviewSort = "newest",
  ) =>
    [
      ...reviewsKeys.public(),
      "infinite",
      productKey,
      zoneCode ?? "default",
      sort,
    ] as const,
  mine: () => [...reviewsKeys.all, "mine"] as const,
  mineList: (status?: string | null, offset = 0) =>
    [...reviewsKeys.mine(), status ?? "all", offset] as const,
  mineInfinite: (status?: string | null) =>
    [...reviewsKeys.mine(), "infinite", status ?? "all"] as const,
};
