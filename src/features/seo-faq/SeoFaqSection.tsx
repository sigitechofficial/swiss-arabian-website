import { getTranslator } from "@/lib/i18n/messages";
import { sectionTitle } from "@/styles/landingChrome";
import type { SeoFaqView } from "./seoFaq";
import { answerHtml } from "./seoFaqText";

/**
 * Visible FAQ section (home page, collection pages). Server-rendered: every
 * answer is in the page HTML (Google requires the FAQPage answers on the page);
 * the native disclosure only folds it. Questions are not headings, so the page
 * keeps one H1 and only this section's H2 (SEO audit headings rule).
 */
export async function SeoFaqSection({ faq }: { faq: SeoFaqView }) {
  const t = await getTranslator(faq.lang === "ar" ? "ar" : "en");
  return (
    <section
      aria-labelledby="seo-faq-heading"
      lang={faq.lang}
      dir={faq.dir}
      data-seo-faq
      className="border-t border-[var(--line,rgba(0,0,0,0.08))] bg-page"
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <h2 id="seo-faq-heading" className={`${sectionTitle} mt-0 mb-7! text-center text-[var(--ink)]`}>
          {t("seoFaq.title")}
        </h2>
        <div className="divide-y divide-[var(--line,rgba(0,0,0,0.1))] border-y border-[var(--line,rgba(0,0,0,0.1))]">
          {faq.entries.map((entry, index) => (
            <details key={index} className="group py-1">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-start text-[15px] font-medium text-[var(--ink)] marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{entry.question}</span>
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 text-[18px] leading-none text-[var(--ink)] transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div
                className="site-page-body pb-5 text-[14px] leading-relaxed text-[var(--ink-2)] [&_p+p]:mt-2"
                dangerouslySetInnerHTML={{ __html: answerHtml(entry.answer) }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
