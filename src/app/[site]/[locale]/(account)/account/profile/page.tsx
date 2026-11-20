import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountProfilePageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return { title: t("pages.title.profile") };
}

export default function AccountProfilePage() {
  return <AccountProfilePageView />;
}
