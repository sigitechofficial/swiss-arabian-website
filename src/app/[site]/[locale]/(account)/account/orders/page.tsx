import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { PurchaseHistoryPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.orders"),
  };
}

export default function AccountOrdersPage() {
  return <PurchaseHistoryPageView />;
}
