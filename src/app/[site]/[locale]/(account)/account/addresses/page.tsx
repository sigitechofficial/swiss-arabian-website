import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { AccountAddressesPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.addresses"),
  };
}

export default function AddressesPage() {
  return <AccountAddressesPageView />;
}
