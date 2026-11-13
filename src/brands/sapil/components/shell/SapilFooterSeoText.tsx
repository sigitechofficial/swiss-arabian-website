import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";
import { dir } from "@/lib/i18n/locales";
import { loadFooterSeoText } from "@/features/seo-footer/footerSeoText.service";
import { FooterSeoHeading } from "@/features/seo-footer/FooterSeoHeading";
import { Wrap } from "../../ui";
import { SapilSeoTextBody } from "./SapilSeoTextBody";

/**
 * Sapil's `FooterSeoText`: the market's SEO text above the footer, in the
 * shopper's language (else the market's default), server-rendered for search
 * engines, in v9 type (same block as the collection SEO text). The heading is
 * the home page's H1 and an H2 elsewhere (shared `FooterSeoHeading`).
 */
export async function SapilFooterSeoText() {
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
      className="bg-sapil-white border-t border-sapil-line py-[56px] max-900:py-[40px]"
    >
      <Wrap className="max-w-[820px]">
        {text.heading ? (
          <FooterSeoHeading className="font-sapil-sans !font-[700] !text-[24px] !leading-[1.25] !tracking-[-.02em] text-center mb-[20px]">
            {text.heading}
          </FooterSeoHeading>
        ) : null}
        {text.bodyHtml ? <SapilSeoTextBody html={text.bodyHtml} /> : null}
      </Wrap>
    </section>
  );
}
