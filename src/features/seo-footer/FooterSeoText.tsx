import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";
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
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-footer-seo-text
      className="border-t border-[var(--line,rgba(0,0,0,0.08))] bg-[var(--cream)]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {text.heading ? (
          <FooterSeoHeading className="mb-4 font-serif text-xl text-[var(--ink)]">
            {text.heading}
          </FooterSeoHeading>
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
