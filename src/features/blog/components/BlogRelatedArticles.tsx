import Image from "next/image";
import Link from "next/link";

type RelatedItem = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
};

/** Figma related grid — You may also like */
export function BlogRelatedArticles({ items }: { items: RelatedItem[] }) {
  if (!items.length) return null;

  return (
    <section
      className="border-t border-sa-border px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-14 lg:px-10"
      aria-label="Related articles"
    >
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
        You may also like
      </p>
      <div className="mx-auto mt-8 grid max-w-[1200px] grid-cols-1 gap-8 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/blog/${item.slug}`}
            className="group flex flex-col"
          >
            <div className="relative aspect-[381/253] w-full overflow-hidden">
              <Image
                src={item.image}
                alt=""
                fill
                quality={90}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 381px"
              />
            </div>
            <h3 className="mt-4 font-sans text-[16px] font-semibold leading-[1.35] text-sa-primary transition-opacity group-hover:opacity-80 sm:text-[17px]">
              {item.title}
            </h3>
            <p className="mt-3 line-clamp-2 text-[13px] leading-[1.6] text-sa-muted sm:text-[13.5px]">
              {item.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
