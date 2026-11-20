import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return { title: t("pages.title.account") };
}

export default function AccountPage() {
  return <AccountPageView />;
}
