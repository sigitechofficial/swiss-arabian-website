import type { SeoFaqView } from "@/features/seo-faq/seoFaq";
import { answerHtml } from "@/features/seo-faq/seoFaqText";
import { getTranslator } from "@/lib/i18n/messages";
import { Wrap } from "../../ui";

/**
 * Sapil's SEO FAQ (home and collection pages), v9 accordion look. Server-rendered:
 * every answer is in the page HTML (Google requires the FAQPage answers on the
 * page); the native disclosure only folds it. The questions are not headings,
 * so the page keeps one H1 and only this section's H2 (SEO audit headings rule).
 */
export async function SapilSeoFaqSection({ faq }: { faq: SeoFaqView }) {
  const t = await getTranslator(faq.lang === "ar" ? "ar" : "en");
  return (
    <section aria-labelledby="seo-faq-heading" lang={faq.lang} dir={faq.dir} data-seo-faq className="py-[64px] max-900:py-[48px]">
      <Wrap className="max-w-[880px]">
        <h2 id="seo-faq-heading" className="font-sapil-sans font-[700] text-[clamp(30px,3vw,40px)] leading-[1.1] tracking-[-.03em] text-center mb-[28px]">
          {t("seoFaq.title")}
        </h2>
        <div className="grid gap-[10px]">
          {faq.entries.map((entry, index) => (
            <details key={index} className="group rounded-[20px] bg-sapil-white px-[22px] max-600:px-[16px]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-[16px] py-[18px] text-start text-[16px] font-[600] text-sapil-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{entry.question}</span>
                <span
                  aria-hidden="true"
                  className="grid place-items-center w-[28px] h-[28px] shrink-0 rounded-full bg-sapil-paper text-[18px] leading-none [transition:transform_.25s] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div
                className="pb-[20px] text-[15px] leading-[1.6] text-sapil-ink-2 [&_p+p]:mt-[8px] [&_a]:text-sapil-accent [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: answerHtml(entry.answer) }}
              />
            </details>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
