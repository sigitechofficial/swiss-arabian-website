"use client";

import { Reveal, InViewItem } from "@/components/motion";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import type { BlogPost } from "../data/blogContent";
import { BlogHero } from "./BlogHero";
import { BlogPagination } from "./BlogPagination";
import { BlogPostCard } from "./BlogPostCard";

/** Figma 796:6987 — Blog listing desktop / tablet / mobile */
export function BlogPageView({
  posts,
  page,
  totalPages,
  total,
}: {
  posts: BlogPost[];
  page: number;
  totalPages: number;
  total: number;
}) {
  const safePage = Math.max(1, Math.min(page, Math.max(totalPages, 1)));

  const hrefForPage = (p: number) => (p <= 1 ? "/blog" : `/blog?page=${p}`);

  return (
    <div className="bg-page">
      <Reveal fade>
        <BlogHero />
      </Reveal>

      <section
        className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-14 lg:pt-10"
        aria-label="All articles"
      >
        <header className="flex items-end justify-between border-b border-sa-border pb-6">
          <h2 className="font-sans text-[22px] font-light tracking-[0.02em] text-sa-primary sm:text-[28px]">
            All Articles
          </h2>
          <p className="pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sa-muted sm:text-[11px]">
            {total} {total === 1 ? "Post" : "Posts"}
          </p>
        </header>

        {posts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            {posts.map((post) => (
              <InViewItem key={post.slug}>
                <BlogPostCard post={post} />
              </InViewItem>
            ))}
          </div>
        ) : (
          <p className="mt-16 text-center text-[14px] text-sa-muted">
            More articles coming soon.
          </p>
        )}

        <div className="mt-10 border-t border-sa-border pt-8 sm:mt-12 sm:pt-10">
          {totalPages > 1 ? (
            <BlogPagination
              page={safePage}
              totalPages={totalPages}
              hrefForPage={hrefForPage}
            />
          ) : null}
        </div>
      </section>

      <Reveal>
        <NewsletterSection />
      </Reveal>
    </div>
  );
}
