import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";
import { dir } from "@/lib/i18n/locales";
import { sectionTitle } from "@/styles/landingChrome";
import { SeoTextBody } from "./SeoTextBody";
import { loadFooterSeoText } from "./footerSeoText.service";
import { FooterSeoHeading } from "./FooterSeoHeading";

/**
 * Market SEO text above the footer, in the shopper's language (else the
 * market's default). Server-rendered so search engines read it.
 */
export async function FooterSeoText() {
  const { locale, zoneCode } = await resolveServerCatalogMarket();
  const text = await loadFooterSeoText(locale, zoneCode);
  if (!text) return null;
  const lang = text.locale.split(/[-_]/)[0] || locale;
  return (
    <section
      aria-label={text.heading || undefined}
      lang={lang}
      dir={dir(lang)}
      data-footer-seo-text
      className="border-t border-[var(--line,rgba(0,0,0,0.08))] bg-[var(--cream)]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {text.heading ? (
          <FooterSeoHeading className={`${sectionTitle} mt-0 mb-7! text-center text-[var(--ink)]`}>
            {text.heading}
          </FooterSeoHeading>
        ) : null}
        {text.bodyHtml ? (
          <SeoTextBody html={text.bodyHtml} lang={lang} />
        ) : null}
      </div>
    </section>
  );
}
