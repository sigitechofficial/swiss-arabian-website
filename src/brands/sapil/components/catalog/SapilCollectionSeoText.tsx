import {
  collectionSeoTextView,
  type CollectionSeoContent,
} from "@/features/seo-footer/collectionSeoTextView";
import { Wrap } from "../../ui";
import { CatalogRoot } from "./CatalogRoot";

/**
 * The collection's own SEO text (per market and language) above the footer,
 * server-rendered for search engines, in v9 type. Nothing when the collection
 * has none (the market-wide SEO text belongs to the footer).
 */
export function SapilCollectionSeoText({
  content,
  fallbackLocale,
}: {
  content: CollectionSeoContent | null | undefined;
  fallbackLocale: string;
}) {
  const text = collectionSeoTextView(content, fallbackLocale);
  if (!text || (!text.heading && !text.bodyHtml)) return null;
  return (
    <CatalogRoot>
      <section
        aria-label={text.heading || undefined}
        lang={text.lang}
        dir={text.dir}
        className="bg-sapil-white border-t border-sapil-line py-[56px]"
      >
        <Wrap className="max-w-[820px]">
          {text.heading ? <h2 className="text-[24px] text-center mb-[20px]">{text.heading}</h2> : null}
          {text.bodyHtml ? (
            <div
              className="text-[15px] leading-[1.7] text-sapil-ink-2 [&_p]:mb-[12px] [&_a]:underline [&_a]:underline-offset-[3px] [&_h3]:text-[18px] [&_h3]:mt-[18px] [&_h3]:mb-[8px] [&_ul]:list-disc [&_ul]:ps-[20px]"
              // Sanitized by collectionSeoTextView (same HTML Swiss Arabian renders).
              dangerouslySetInnerHTML={{ __html: text.bodyHtml }}
            />
          ) : null}
        </Wrap>
      </section>
    </CatalogRoot>
  );
}
