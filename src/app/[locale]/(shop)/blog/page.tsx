import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { BlogPageView } from "@/features/blog/components/BlogPageView";
import { fetchBlogPosts } from "@/features/blog/api/blogApi";

const PAGE_SIZE = 12;

async function load(pageParam?: string | string[]) {
  const page = Math.max(1, Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1);
  const { zoneCode, contentLanguage, locale } = await resolveRequestCatalogMarket();
  const result = await fetchBlogPosts({
    zoneCode,
    languageCode: contentLanguage || locale,
    page,
    limit: PAGE_SIZE,
  });
  return { page, result };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { t } = await routeTranslator();
  const base = await pageMetadata({
    path: "/blog",
    title: t("pages.blog.title"),
    description: t("pages.blog.description"),
  });
  const { result } = await load((await searchParams).page);
  // Kept out of search until there is at least one live post.
  return result.total > 0 ? base : { ...base, robots: { index: false, follow: true } };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, result } = await load((await searchParams).page);
  return (
    <BlogPageView posts={result.posts} page={page} totalPages={result.totalPages} total={result.total} />
  );
}
