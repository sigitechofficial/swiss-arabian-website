import { FooterSeoText } from "./FooterSeoText";
import { collectionSeoTextView, type CollectionSeoContent } from "./collectionSeoTextView";

/**
 * SEO text above the footer on a collection page: the collection's own text
 * (per market and language, heading as H2) when it has one, else the market's
 * SEO text block. Server-rendered so search engines read it.
 */
export function CollectionSeoText({
  content,
  fallbackLocale,
}: {
  content: CollectionSeoContent | null | undefined;
  fallbackLocale: string;
}) {
  const text = collectionSeoTextView(content, fallbackLocale);
  if (!text) {
    return (
      <div className="mt-auto">
        <FooterSeoText />
      </div>
    );
  }
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
          <h2 className="mb-4 font-serif text-xl text-[var(--ink)]">{text.heading}</h2>
        ) : null}
        {text.bodyHtml ? (
          <div
            className="site-page-body text-sm"
            dangerouslySetInnerHTML={{ __html: text.bodyHtml }}
          />
        ) : null}
      </div>
    </section>
  );
}
