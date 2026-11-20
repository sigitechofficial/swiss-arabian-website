import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { fetchBlogArticle } from "@/features/blog/api/blogApi";
import { BlogArticlePageView, CatalogJsonLd } from "@brand-ui";
import { blogBreadcrumbs } from "@/features/blog/routes/blogListingRoute";
import { requireBrandFeature } from "@/lib/brand/featureGate";
import { routeTranslator } from "@/lib/i18n/routeLocale";

async function load(slug: string) {
  const { zoneCode, contentLanguage, locale } = await resolveRequestCatalogMarket();
  return fetchBlogArticle({ slug, zoneCode, languageCode: contentLanguage || locale });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  requireBrandFeature("blog");
  const { slug } = await params;
  const article = await load(slug);
  if (!article) {
    const { t } = await routeTranslator();
    return { title: t("blog.notFound.title"), robots: { index: false, follow: true } };
  }
  return pageMetadata({
    path: `/blog/${article.slug}`,
    title: article.seoTitle || article.heroTitle,
    description: article.seoDescription || article.heroSubtitle,
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  requireBrandFeature("blog");
  const { slug } = await params;
  const article = await load(slug);
  if (!article) notFound();
  return (
    <>
      <CatalogJsonLd data={await blogBreadcrumbs({ title: article.heroTitle, slug: article.slug })} />
      <BlogArticlePageView article={article} />
    </>
  );
}
