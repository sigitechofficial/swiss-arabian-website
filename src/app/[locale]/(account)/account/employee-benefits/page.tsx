import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountEmployeeBenefitsPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.employeeBenefits"),
  };
}

export default function AccountEmployeeBenefitsPage() {
  return <AccountEmployeeBenefitsPageView />;
}
