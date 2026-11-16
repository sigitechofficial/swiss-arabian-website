import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { CheckoutPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.checkout"),
    robots: { index: false, follow: false },
  };
}

export default function CheckoutPage() {
  return <CheckoutPageView />;
}
