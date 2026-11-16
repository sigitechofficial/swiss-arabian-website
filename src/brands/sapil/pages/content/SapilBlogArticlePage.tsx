"use client";

import { useSyncExternalStore } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import type { BlogArticleDetail } from "@/features/blog/data/blogContent";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Breadcrumbs, Button, EYEBROW, SectionHead, Wrap, cx } from "../../ui";
import { SapilBlogPostCard } from "../../components/content/BlogPostCard";
import { SAPIL_PROSE } from "../../components/content/prose";
import { SapilLink } from "../../components/shared/SapilLink";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";

const noSubscribe = () => () => {};

/** Sapil's `BlogArticlePageView` (system design): header, picture, article typography, tags, share, related posts. */
export function SapilBlogArticlePage({ article }: { article: BlogArticleDetail | null }) {
  const t = useSapilCopy();
  const sharePath = article ? `/blog/${article.slug}` : "/blog";
  // Full address in the browser; the path while rendering on the server (no mismatch).
  const shareUrl = useSyncExternalStore(noSubscribe, () => window.location.href, () => sharePath);

  if (!article) {
    return (
      <SapilStatePanel
        eyebrow={t("content.blog")}
        title={t("content.articleMissingTitle")}
        accent={t("content.articleMissingAccent")}
        lead={t("content.articleMissingLead")}
        actions={
          <Button href="/blog" LinkComponent={SapilLink}>
            {t("content.backToBlog")}
          </Button>
        }
      />
    );
  }

  const share = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` },
    { label: "X", href: `https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <div className="pb-[88px]">
      <Wrap>
        <Breadcrumbs
          label={t("content.breadcrumb")}
          items={[{ label: t("content.home"), href: "/" }, { label: t("content.blog"), href: "/blog" }, { label: article.heroTitle }]}
          LinkComponent={SapilLink}
        />
      </Wrap>
      <article>
        <header className="max-w-[820px] mx-auto px-sapil-gut text-center mt-[24px] mb-[32px]">
          {article.heroEyebrow ? <p className={EYEBROW}>{article.heroEyebrow}</p> : null}
          <h1 className="font-sapil-display !font-[400] text-[clamp(40px,5vw,72px)] !leading-[1.02] mt-[14px] mb-[12px]">{article.heroTitle}</h1>
          {article.heroSubtitle ? <p className="font-sapil-serif italic text-[22px] text-sapil-ink-2">{article.heroSubtitle}</p> : null}
        </header>
        {article.heroImage ? (
          <Wrap>
            <div className="relative aspect-[16/7] rounded-[32px] overflow-hidden bg-sapil-sand max-900:aspect-[4/3] max-900:rounded-[24px]">
              <MediaImage src={article.heroImage} alt="" fill preload sizes="(max-width: 1440px) 100vw, 1440px" className="object-cover" />
            </div>
          </Wrap>
        ) : null}
        <div className={cx("max-w-[720px] mx-auto px-sapil-gut mt-[48px]", SAPIL_PROSE)}>
          {article.body.map((block, index) => {
            const key = `${block.type}-${index}`;
            switch (block.type) {
              case "lead":
                return (
                  <p key={key} className="!text-[20px] !leading-[1.6] text-sapil-ink">
                    {block.text}
                  </p>
                );
              case "p":
                return <p key={key}>{block.text}</p>;
              case "h2":
                return <h2 key={key}>{block.text}</h2>;
              case "notes":
                return (
                  <dl key={key} className="border-t border-sapil-line">
                    {block.rows.map((row) => (
                      <div key={row.label} className="grid grid-cols-[110px_1fr] gap-[12px] py-[12px] border-b border-sapil-line text-[15px]">
                        <dt className={cx(EYEBROW, "pt-[3px]")}>{row.label}</dt>
                        <dd className="text-sapil-ink">{row.notes}</dd>
                      </div>
                    ))}
                  </dl>
                );
              case "wear":
                return (
                  <div key={key} className="rounded-sapil bg-sapil-p-mint p-[20px]">
                    <p className={EYEBROW}>{t("content.wearItWhen")}</p>
                    <p className="mt-[8px] text-sapil-ink">{block.text}</p>
                  </div>
                );
              case "quote":
                return (
                  <blockquote key={key}>
                    <p>&ldquo;{block.text}&rdquo;</p>
                  </blockquote>
                );
              default:
                return null;
            }
          })}
          <div className="!mt-[40px] pt-[20px] border-t border-sapil-line flex flex-wrap items-center justify-between gap-[16px]">
            {article.tags.length ? (
              <ul className="!list-none !ps-0 flex flex-wrap gap-[8px]" aria-label={t("content.tags")}>
                {article.tags.map((tag) => (
                  <li key={tag} className="!mt-0 text-[13px] font-[500] rounded-full border border-sapil-line-2 bg-sapil-card py-[6px] px-[14px] text-sapil-ink">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-[14px] text-[14px]">
              <span className="font-[600] text-sapil-ink">{t("content.share")}</span>
              {share.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="!no-underline !font-[500] !text-sapil-ink-2 hover:!text-sapil-accent">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <p className="!mt-[32px]">
            <Button variant="link" href="/blog" LinkComponent={SapilLink} className="!no-underline">
              {t("content.backToBlog")}
            </Button>
          </p>
        </div>
      </article>
      {article.related.length ? (
        <Wrap as="section" className="mt-[88px]" aria-labelledby="related-posts">
          <SectionHead id="related-posts" eyebrow={t("content.relatedEyebrow")} title={t("content.relatedTitle")} accent={t("content.relatedAccent")} />
          <div className="grid grid-cols-3 gap-[24px] max-900:grid-cols-1 max-900:gap-[16px]">
            {article.related.map((post) => (
              <SapilBlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </Wrap>
      ) : null}
    </div>
  );
}
