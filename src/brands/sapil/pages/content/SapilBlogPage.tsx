"use client";

import { useMemo, useState } from "react";
import type { BlogPost } from "@/features/blog/data/blogContent";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Breadcrumbs, Button, Chip, EYEBROW, Serif, Wrap } from "../../ui";
import { SapilBlogPostCard } from "../../components/content/BlogPostCard";
import { SapilLink } from "../../components/shared/SapilLink";

/** Topic chips: "All" plus each category, with counts (v9 blog tags). */
export function blogTags(posts: BlogPost[]): Array<{ tag: string | null; count: number }> {
  const counts = new Map<string, number>();
  for (const p of posts) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return [{ tag: null, count: posts.length }, ...[...counts].map(([tag, count]) => ({ tag, count }))];
}

/** Sapil's `BlogPageView` (v9 blog): topic chips, a featured post, a grid. */
export function SapilBlogPage({ posts, page, totalPages }: { posts: BlogPost[]; page: number; totalPages: number; total: number }) {
  const t = useSapilCopy();
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => blogTags(posts), [posts]);
  const list = tag ? posts.filter((p) => p.category === tag) : posts;
  const [featured, ...rest] = list;
  const safePage = Math.max(1, Math.min(page, Math.max(totalPages, 1)));
  const hrefForPage = (p: number) => (p <= 1 ? "/blog" : `/blog?page=${p}`);

  return (
    <Wrap as="div" className="pb-[88px]">
      <Breadcrumbs
        label={t("content.breadcrumb")}
        items={[{ label: t("content.home"), href: "/" }, { label: t("content.blog") }]}
        LinkComponent={SapilLink}
      />
      <header className="text-center max-w-[720px] mt-[24px] mx-auto mb-[36px]">
        <p className={EYEBROW}>{t("content.blogEyebrow")}</p>
        <h1 className="font-sapil-display !font-[400] text-[clamp(48px,6vw,84px)] !leading-[1] mt-[14px] mb-[12px]">
          {t("content.blogTitle")} <Serif>{t("content.blogAccent")}</Serif>
        </h1>
        <p className="text-sapil-ink-2 text-[17px]">{t("content.blogLead")}</p>
        {tags.length > 2 ? (
          <div className="flex justify-center flex-wrap gap-[8px] mt-[24px]" role="group" aria-label={t("content.blogFilter")}>
            {tags.map((x) => (
              <Chip key={x.tag ?? "all"} pressed={tag === x.tag} count={x.count} onClick={() => setTag(x.tag)}>
                {x.tag ?? t("content.blogAll")}
              </Chip>
            ))}
          </div>
        ) : null}
      </header>
      {featured ? (
        <>
          <SapilBlogPostCard post={featured} big eager />
          {rest.length ? (
            <div className="grid grid-cols-3 gap-[24px] max-900:grid-cols-1 max-900:gap-[16px]">
              {rest.map((post) => (
                <SapilBlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="border border-dashed border-sapil-line-2 rounded-sapil p-[48px] text-center text-sapil-ink-2">
          <b className="block font-sapil-serif font-[400] text-[24px] text-sapil-ink mb-[6px]">{t("content.blogEmptyTitle")}</b>
          {t("content.blogEmptyText")}
        </div>
      )}
      {totalPages > 1 ? (
        <nav aria-label={t("content.pagination")} className="flex items-center justify-center gap-[16px] mt-[40px] text-[14px] text-sapil-ink-2">
          {safePage > 1 ? (
            <Button variant="line" href={hrefForPage(safePage - 1)} LinkComponent={SapilLink} rel="prev">
              {t("content.newer")}
            </Button>
          ) : null}
          <span aria-current="page">{t("content.pageOf", { page: safePage, total: totalPages })}</span>
          {safePage < totalPages ? (
            <Button variant="line" href={hrefForPage(safePage + 1)} LinkComponent={SapilLink} rel="next">
              {t("content.older")}
            </Button>
          ) : null}
        </nav>
      ) : null}
    </Wrap>
  );
}
