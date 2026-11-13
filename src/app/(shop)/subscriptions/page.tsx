import {
  CatalogJsonLd,
  pageBreadcrumbJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { SubscriptionsPageView } from "@/features/subscriptions";
import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";

export default async function SubscriptionsPage() {
  const { locale } = await resolveServerCatalogMarket();
  return (
    <>
      {/* Named as the page's hero names it. */}
      <CatalogJsonLd
        data={pageBreadcrumbJsonLd(locale, { name: "The Scent Club", path: "/subscriptions" })}
      />
      <SubscriptionsPageView />
    </>
  );
}
