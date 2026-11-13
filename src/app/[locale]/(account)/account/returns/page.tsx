import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountAfterSalesPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.returns"),
  };
}

export default function AccountReturnsPage() {
  return <AccountAfterSalesPageView />;
}
