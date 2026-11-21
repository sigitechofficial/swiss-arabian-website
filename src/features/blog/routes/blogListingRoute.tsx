import { serverLocaleConfig } from "@/lib/i18n/serverLocaleConfig";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { fetchBlogPosts } from "@/features/blog/api/blogApi";
import { requireBrandFeature } from "@/lib/brand/featureGate";
import { breadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { BlogPageView, CatalogJsonLd } from "@brand-ui";

/**
 * The Journal's post list. Page 1 is `/blog`; page N is `/blog?page=N`, served
 * by the proxy from its own cached page (`/blog/p/N`), so no page reads the
 * request. The market comes from the page tree.
 */
const PAGE_SIZE = 12;

async function load(page: number) {
  const { zoneCode, contentLanguage, locale } = await resolveRequestCatalogMarket();
  return fetchBlogPosts({ zoneCode, languageCode: contentLanguage || locale, page, limit: PAGE_SIZE });
}

export async function blogListingMetadata(page: number): Promise<Metadata> {
  const localeConfig = await serverLocaleConfig();
  requireBrandFeature("blog");
  const { locale, t } = await routeTranslator();
  const metadata = await pageMetadata({
    path: "/blog",
    title: t("pages.blog.title"),
    description: t("pages.blog.description"),
  });
  if (page > 1) {
    // Page 2+ is its own page for search engines (self-canonical), not a copy of page 1.
    const canonical = metadata.alternates?.canonical;
    const base = typeof canonical === "string" ? canonical : withLocalePrefix("/blog", locale, localeConfig);
    metadata.alternates = { ...metadata.alternates, canonical: `${base}?page=${page}` };
  }
  // Kept out of search until there is at least one live post.
  const result = await load(page);
  return result.total > 0 ? metadata : { ...metadata, robots: { index: false, follow: true } };
}

/** Home › Journal, for search engines (SEO audit p16: breadcrumbs on every page). */
export async function blogBreadcrumbs(article?: { title: string; slug: string }) {
  const localeConfig = await serverLocaleConfig();
  const { locale, t } = await routeTranslator();
  const items = [
    { name: t("home"), url: withLocalePrefix("/", locale, localeConfig) },
    { name: t("pages.blog.title"), url: withLocalePrefix("/blog", locale, localeConfig) },
  ];
  if (article) items.push({ name: article.title, url: withLocalePrefix(`/blog/${article.slug}`, locale, localeConfig) });
  return breadcrumbJsonLd(items);
}

export async function BlogListing({ page }: { page: number }) {
  requireBrandFeature("blog");
  const result = await load(page);
  return (
    <>
      <CatalogJsonLd data={await blogBreadcrumbs()} />
      <BlogPageView posts={result.posts} page={page} totalPages={result.totalPages} total={result.total} />
    </>
  );
}
