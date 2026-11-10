import type { Metadata } from "next";
import { HomePageView } from "@/features/home";
import { CatalogJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { loadPublishedPageSeo, pageJsonLd, pageMetadata } from "@/lib/seo/pageSeo";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  loadRequestBrandIdentity,
  loadServerHome,
  resolveServerCatalogMarket,
} from "@/lib/seo/catalogPage";
import { loadFooterSeoText } from "@/features/seo-footer/footerSeoText.service";

/**
 * Home fallback when SEO Management has no page for "/": the brand's name and
 * description (Brand identity) in the shopper's language and market.
 */
function homeTitle(brandName: string, locale: string) {
  return locale === "ar"
    ? `${brandName} | عطور فاخرة وعود`
    : `${brandName} | Luxury Perfumes, Oud & Fragrances`;
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await loadRequestBrandIdentity();
  return pageMetadata({
    path: "/",
    title: homeTitle(brand.name, "en"),
    titleAr: homeTitle(brand.name, "ar"),
    description: brand.description ?? undefined,
    descriptionAr: brand.description ?? undefined,
  });
}

export default async function HomePage() {
  const { locale, seo } = await loadPublishedPageSeo("/");
  const adminJsonLd = await pageJsonLd("/");
  const brand = await loadRequestBrandIdentity();
  const home = withLocalePrefix("/", locale);
  // One H1 per page: the market's SEO text heading (above the footer) when there is
  // one, else this one. The hero title is not a heading (SEO audit).
  const market = await resolveServerCatalogMarket();
  const [footerText, initialHome] = await Promise.all([
    loadFooterSeoText(market.locale, market.zoneCode),
    loadServerHome(),
  ]);
  // Search engines get Organization + WebSite unless the admin publishes their own.
  const types = new Set(adminJsonLd.map((entry) => String(entry["@type"] ?? "")));
  const defaults = [
    types.has("Organization")
      ? null
      : {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brand.name,
          ...(brand.names.length > 1
            ? { alternateName: brand.names.filter((n) => n !== brand.name) }
            : {}),
          url: brand.url || home,
          ...(brand.logo || brand.squareLogo ? { logo: brand.squareLogo || brand.logo } : {}),
          ...(brand.description ? { description: brand.description } : {}),
          ...(brand.sameAs.length ? { sameAs: brand.sameAs } : {}),
        },
    types.has("WebSite")
      ? null
      : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: brand.name,
          url: home,
          inLanguage: locale,
          potentialAction: {
            "@type": "SearchAction",
            target: `${withLocalePrefix("/search", locale)}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
  ].filter(Boolean) as Array<Record<string, unknown>>;
  return (
    <>
      {[...defaults, ...adminJsonLd].map((data, index) => (
        <CatalogJsonLd key={index} data={data} />
      ))}
      {/* Sections are server-rendered from the published homepage (the browser keeps it fresh). */}
      {footerText?.heading ? null : (
        <h1 className="sr-only">{seo?.title || homeTitle(brand.name, locale)}</h1>
      )}
      <HomePageView initial={initialHome} />
    </>
  );
}
