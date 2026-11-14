import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountReviewsPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.reviews"),
  };
}

export default function AccountReviewsPage() {
  return <AccountReviewsPageView />;
}
