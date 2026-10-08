"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";
import { getBlogArticleDetail } from "../data/blogContent";
import { BlogArticleHero } from "./BlogArticleHero";
import { BlogNoteTable } from "./BlogNoteTable";
import { BlogRelatedArticles } from "./BlogRelatedArticles";

const SHARE = [
  { label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php" },
  { label: "Instagram", href: "https://www.instagram.com/swissarabian/" },
  { label: "WhatsApp", href: "https://wa.me/?text=" },
] as const;

/** Figma 915:7094 — Blog Article detail */
export function BlogArticlePageView() {
  const params = useParams<{ slug: string }>();
  const article = getBlogArticleDetail(params.slug);

  if (!article) {
    return (
      <CatalogEmptyState
        title="Article not found"
        description="This journal entry isn’t available. Browse all articles from The Journal."
      />
    );
  }

  const sharePath = `/blog/${article.slug}`;
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : sharePath;

  return (
    <div className="bg-page">
      <BlogArticleHero
        image={article.heroImage}
        eyebrow={article.heroEyebrow}
        title={article.heroTitle}
        subtitle={article.heroSubtitle}
      />

      <article className="mx-auto w-full max-w-[720px] px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="flex flex-col">
          {article.body.map((block, index) => {
            const key = `${block.type}-${index}`;
            switch (block.type) {
              case "lead":
                return (
                  <p
                    key={key}
                    className="text-[17px] font-medium leading-[1.7] text-sa-primary sm:text-[20px]"
                  >
                    {block.text}
                  </p>
                );
              case "p":
                return (
                  <p
                    key={key}
                    className={`${index === 0 ? "" : "mt-6"} text-[15px] leading-[1.85] text-sa-primary sm:text-[17px]`}
                  >
                    {block.text}
                  </p>
                );
              case "h2":
                return (
                  <h2
                    key={key}
                    className={`${index === 0 ? "" : "mt-11"} font-sans text-[22px] font-bold text-sa-primary sm:text-[26px]`}
                  >
                    {block.text}
                  </h2>
                );
              case "notes":
                return (
                  <div key={key} className="mt-6">
                    <BlogNoteTable rows={block.rows} />
                  </div>
                );
              case "wear":
                return (
                  <div key={key} className="mt-7">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold sm:text-[10.5px]">
                      Wear it when
                    </p>
                    <p className="mt-2.5 text-[15px] leading-[1.85] text-sa-primary sm:text-[17px]">
                      {block.text}
                    </p>
                  </div>
                );
              case "quote":
                return (
                  <blockquote
                    key={key}
                    className="mt-10 border-l-[3px] border-terra py-1.5 pl-6 sm:pl-7"
                  >
                    <p className="font-sans text-[18px] font-medium italic leading-[1.45] text-sa-primary sm:text-[22px]">
                      &ldquo;{block.text}&rdquo;
                    </p>
                  </blockquote>
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="mt-10 border-t border-sa-border pt-5" />

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="border border-sa-border px-3 py-1 text-[11px] tracking-[0.04em] text-sa-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
            <span className="font-semibold text-sa-primary">Share</span>
            {SHARE.map((item) => (
              <a
                key={item.label}
                href={
                  item.label === "WhatsApp"
                    ? `${item.href}${encodeURIComponent(shareUrl)}`
                    : item.label === "Facebook"
                      ? `${item.href}?u=${encodeURIComponent(shareUrl)}`
                      : item.href
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sa-muted transition-colors hover:text-terra"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/blog"
            className="inline-flex text-[11px] font-bold uppercase tracking-[0.12em] text-terra transition-opacity hover:opacity-80"
          >
            ← Back to The Journal
          </Link>
        </div>
      </article>

      <BlogRelatedArticles items={article.related} />
      <NewsletterSection />
    </div>
  );
}
