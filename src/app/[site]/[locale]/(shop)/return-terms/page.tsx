import type { Metadata } from "next";
import { pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { CatalogJsonLd, ReturnTermsPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return pageMetadata({
    path: "/return-terms",
    title: t("returnsPolicy.termsPage.title"),
    description: t("returnsPolicy.termsPage.description"),
  });
}

/** The market's return terms today, generated from its after-sales settings (each brand draws its own view). */
export default async function ReturnTermsPage() {
  const { locale, t } = await routeTranslator();
  return (
    <>
      <CatalogJsonLd data={await pageBreadcrumbJsonLd(locale, { name: t("returnsPolicy.termsPage.title"), path: "/return-terms" })} />
      <ReturnTermsPageView />
    </>
  );
}
