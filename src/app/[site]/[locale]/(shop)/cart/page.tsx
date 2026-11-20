import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { CartPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  // A form or the bag, not content: named in the tab, kept out of search.
  return { title: t("pages.title.bag"), robots: { index: false, follow: true } };
}

export default function CartPage() {
  return <CartPageView />;
}
