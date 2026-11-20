import { sectionTitle } from "@/styles/landingChrome";
import { SeoTextBody } from "./SeoTextBody";
import { collectionSeoTextView, type CollectionSeoContent } from "./collectionSeoTextView";

/**
 * SEO text above the footer on a collection page: the collection's own text
 * (per market and language, heading as H2). Nothing when the collection has
 * none: the home page's text is not repeated here (SEO audit p6).
 * Server-rendered so search engines read it.
 */
export function CollectionSeoText({
  content,
  fallbackLocale,
}: {
  content: CollectionSeoContent | null | undefined;
  fallbackLocale: string;
}) {
  const text = collectionSeoTextView(content, fallbackLocale);
  if (!text || (!text.heading && !text.bodyHtml)) return null;
  return (
    <section
      aria-label={text.heading || undefined}
      lang={text.lang}
      dir={text.dir}
      data-collection-seo-text
      className="mt-auto border-t border-[var(--line,rgba(0,0,0,0.08))] bg-[var(--cream)]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {text.heading ? (
          <h2 className={`${sectionTitle} mt-0 mb-7! text-center text-[var(--ink)]`}>{text.heading}</h2>
        ) : null}
        {text.bodyHtml ? (
          <SeoTextBody html={text.bodyHtml} lang={text.lang} />
        ) : null}
      </div>
    </section>
  );
}
