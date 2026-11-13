"use client";

import { MediaImage } from "@/components/ui/MediaImage";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui";
import { SapilLink } from "../shared/SapilLink";

export type SapilPostCardData = { slug: string; title: string; category?: string | null; excerpt?: string | null; image?: string | null };

/** v9 `.post` (and `.post.big` for the featured one). */
export function SapilBlogPostCard({ post, big, eager }: { post: SapilPostCardData; big?: boolean; eager?: boolean }) {
  const t = useSapilCopy();
  return (
    <SapilLink
      href={`/blog/${post.slug}`}
      className={cx(
        "group/post flex flex-col bg-sapil-white rounded-[24px] overflow-hidden [transition:transform_.4s_var(--sapil-ease),box-shadow_.4s_var(--sapil-ease)] hover:[transform:translateY(-4px)] hover:shadow-sapil",
        big && "!grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] mb-[24px] max-900:grid-cols-1",
      )}
    >
      <span className={cx("relative block bg-sapil-sand overflow-hidden", big ? "min-h-[380px] max-900:min-h-0 max-900:aspect-[16/9]" : "aspect-[16/9]")}>
        {post.image ? (
          <MediaImage
            src={post.image}
            alt=""
            fill
            sizes={big ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 900px) 100vw, 33vw"}
            preload={eager}
            loading={eager ? "eager" : "lazy"}
            className="object-cover [transition:transform_.6s_var(--sapil-ease)] group-hover/post:[transform:scale(1.04)]"
          />
        ) : null}
      </span>
      <span className={cx("flex flex-col gap-[10px]", big ? "justify-center p-[40px] max-900:p-[22px]" : "pt-[20px] px-[22px] pb-[24px] flex-1")}>
        {post.category ? (
          <span className="text-[13px] text-sapil-muted">
            <b className="text-sapil-accent font-[600]">{post.category}</b>
          </span>
        ) : null}
        <span
          className={cx(
            "text-sapil-ink",
            big
              ? "font-sapil-display font-[400] text-[clamp(28px,2.8vw,40px)] leading-[1.1]"
              : "font-sapil-sans font-[600] text-[19px] leading-[1.3] tracking-[-.01em]",
          )}
        >
          {post.title}
        </span>
        {big && post.excerpt ? <span className="text-sapil-ink-2 text-[15px]">{post.excerpt}</span> : null}
        <span className="text-[14px] font-[600] text-sapil-accent mt-auto">
          {t("content.readArticle")} <span aria-hidden="true">→</span>
        </span>
      </span>
    </SapilLink>
  );
}
