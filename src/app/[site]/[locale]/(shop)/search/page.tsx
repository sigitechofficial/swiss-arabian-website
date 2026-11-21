import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { CatalogSearchSort } from "@/features/catalog/api/catalog.service";
import { SEARCH_SORT_OPTIONS } from "@/features/search/constants";
import { SearchPageView } from "@brand-ui";

/**
 * Results depend on each search (`?q=`, `?sort=`): rendered per request, never
 * cached (and kept out of search engines).
 */
export const dynamic = "force-dynamic";

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
  const { t } = await routeTranslator();
  return {
    title: query ? t("search.resultsFor", { query }) : t("pages.title.search"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = one(params.q);
  const sort = parseSort(one(params.sort));
  return <SearchPageView query={query} sort={sort} />;
}
