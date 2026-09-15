import type { Metadata } from "next";
import { SearchPageView } from "@/features/search";
import type { CatalogSearchSort } from "@/features/catalog/api/catalog.service";
import { SEARCH_SORT_OPTIONS } from "@/features/search/constants";

const SORT_VALUES = new Set(SEARCH_SORT_OPTIONS.map((option) => option.value));

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseSort(raw: string): CatalogSearchSort {
  return SORT_VALUES.has(raw as CatalogSearchSort)
    ? (raw as CatalogSearchSort)
    : "newest";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}): Promise<Metadata> {
  const query = one((await searchParams).q).trim();
  return {
    title: query ? `Search: ${query}` : "Search",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = one(params.q);
  const page = Math.max(1, Number.parseInt(one(params.page), 10) || 1);
  const sort = parseSort(one(params.sort));
  return <SearchPageView query={query} page={page} sort={sort} />;
}
