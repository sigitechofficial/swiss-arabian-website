import type { CatalogSearchSort } from "@/features/catalog/api/catalog.service";
import { SEARCH_SORT_OPTIONS } from "../constants";

export function parseSearchSort(value: string | null): CatalogSearchSort {
  const match = SEARCH_SORT_OPTIONS.find((option) => option.value === value);
  return match?.value ?? "newest";
}

export function searchHref(opts: {
  q: string;
  page?: number;
  sort?: string;
}): string {
  const params = new URLSearchParams();
  const q = opts.q.trim();
  if (q) params.set("q", q);
  if (opts.sort && opts.sort !== "newest") params.set("sort", opts.sort);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
