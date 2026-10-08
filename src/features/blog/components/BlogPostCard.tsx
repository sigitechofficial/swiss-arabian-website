import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "../data/blogContent";

type BlogPostCardProps = {
  post: BlogPost;
};

/** Figma Post Card — thumbnail, category, title, excerpt, Read Article */
export function BlogPostCard({ post }: BlogPostCardProps) {
  const href = `/blog/${post.slug}`;

  return (
    <article className="flex h-full flex-col">
      <Link
        href={href}
        className="relative block aspect-[405/270] w-full overflow-hidden"
      >
        <Image
          src={post.image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 405px"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
            {post.category}
          </p>
          <h2 className="font-sans text-[16px] font-semibold leading-[1.4] text-sa-primary">
            <Link href={href} className="transition-opacity hover:opacity-80">
              {post.title}
            </Link>
          </h2>
          <p className="line-clamp-3 text-[13px] leading-[1.65] text-sa-muted">
            {post.excerpt}
          </p>
        </div>
        <Link
          href={href}
          className="mt-auto inline-flex text-[11px] font-bold uppercase tracking-[0.12em] text-terra transition-colors hover:opacity-80"
        >
          Read Article →
        </Link>
      </div>
    </article>
  );
}
