import { apiGet } from "@/lib/api/apiClient";
import type { ArticleBlock, BlogArticleDetail, BlogPost } from "../data/blogContent";

export type BlogListResult = {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BlogArticle = BlogArticleDetail & {
  seoTitle: string;
  seoDescription: string;
  readingMinutes: number;
  publishedAt: string | null;
};

type RawCard = { slug: string; title: string; excerpt: string; category: string; image: string };

const EMPTY: BlogListResult = { posts: [], total: 0, page: 1, pageSize: 12, totalPages: 0 };

/** Published Journal posts for the market + language (no sign-in). Empty on any failure. */
export async function fetchBlogPosts(input: {
  zoneCode: string;
  languageCode: string;
  page?: number;
  limit?: number;
}): Promise<BlogListResult> {
  if (!input.zoneCode) return EMPTY;
  const params = new URLSearchParams({
    zoneCode: input.zoneCode,
    languageCode: input.languageCode || "en",
    page: String(input.page ?? 1),
    limit: String(input.limit ?? 12),
  });
  try {
    const data = await apiGet<{ items: RawCard[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/storefront/blog/posts?${params.toString()}`,
      { skipAuth: true },
    );
    return {
      posts: (data.items ?? []).map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category, image: p.image })),
      total: data.total ?? 0,
      page: data.page ?? 1,
      pageSize: data.pageSize ?? 12,
      totalPages: data.totalPages ?? 0,
    };
  } catch {
    return EMPTY;
  }
}

/** One published post, or null when it doesn't exist for this market + language. */
export async function fetchBlogArticle(input: {
  slug: string;
  zoneCode: string;
  languageCode: string;
}): Promise<BlogArticle | null> {
  if (!input.zoneCode || !input.slug) return null;
  const params = new URLSearchParams({ zoneCode: input.zoneCode, languageCode: input.languageCode || "en" });
  try {
    const data = await apiGet<{
      slug: string;
      heroImage: string;
      heroEyebrow: string;
      heroTitle: string;
      heroSubtitle: string;
      body: ArticleBlock[];
      tags: string[];
      related: BlogArticleDetail["related"];
      seoTitle: string;
      seoDescription: string;
      readingMinutes: number;
      publishedAt: string | null;
    }>(`/storefront/blog/posts/${encodeURIComponent(input.slug)}?${params.toString()}`, { skipAuth: true });
    return {
      slug: data.slug,
      heroImage: data.heroImage,
      heroEyebrow: data.heroEyebrow,
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      body: Array.isArray(data.body) ? data.body : [],
      tags: data.tags ?? [],
      related: data.related ?? [],
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      readingMinutes: data.readingMinutes,
      publishedAt: data.publishedAt,
    };
  } catch {
    return null;
  }
}

/** Live post addresses for the sitemap (one language at a time). */
export async function fetchBlogSlugs(input: {
  zoneCode: string;
  languageCode: string;
}): Promise<{ slug: string; updatedAt: string }[]> {
  if (!input.zoneCode) return [];
  const params = new URLSearchParams({ zoneCode: input.zoneCode, languageCode: input.languageCode });
  try {
    const rows = await apiGet<{ slug: string; updatedAt: string }[]>(`/storefront/blog/slugs?${params.toString()}`, {
      skipAuth: true,
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
