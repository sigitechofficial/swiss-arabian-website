import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { BlogArticlePageView } from "@/features/blog/components/BlogArticlePageView";
import { fetchBlogArticle } from "@/features/blog/api/blogApi";

async function load(slug: string) {
  const { zoneCode, contentLanguage, locale } = await resolveRequestCatalogMarket();
  return fetchBlogArticle({ slug, zoneCode, languageCode: contentLanguage || locale });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await load(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: true } };
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
  const { slug } = await params;
  const article = await load(slug);
  if (!article) notFound();
  return <BlogArticlePageView article={article} />;
}
