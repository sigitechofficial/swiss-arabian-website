import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { AccountSecurityPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.security"),
  };
}

export default function SecurityPage() {
  return <AccountSecurityPageView />;
}
