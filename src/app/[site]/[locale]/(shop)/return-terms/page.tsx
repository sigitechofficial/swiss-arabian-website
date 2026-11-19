import type { Metadata } from "next";
import { ReturnTermsPageView } from "@/features/afterSales/components/ReturnTermsPageView";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { pageMetadata } from "@/lib/seo/pageSeo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return pageMetadata({
    path: "/return-terms",
    title: t("returnsPolicy.termsPage.title"),
    description: t("returnsPolicy.termsPage.description"),
  });
}

/** The market's return terms today, generated from its after-sales settings. */
export default function ReturnTermsPage() {
  return <ReturnTermsPageView />;
}
