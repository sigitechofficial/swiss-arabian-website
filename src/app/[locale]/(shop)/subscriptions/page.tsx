import { pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { CatalogJsonLd, SubscriptionsPageView } from "@brand-ui";

export default async function SubscriptionsPage() {
  const { locale } = await resolveRequestCatalogMarket();
  return (
    <>
      {/* Named as the page's hero names it. */}
      <CatalogJsonLd
        data={await pageBreadcrumbJsonLd(locale, { name: "The Scent Club", path: "/subscriptions" })}
      />
      <SubscriptionsPageView />
    </>
  );
}
