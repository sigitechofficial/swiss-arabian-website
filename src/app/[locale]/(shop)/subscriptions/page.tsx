import { pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { CatalogJsonLd, SubscriptionsPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/features";

export default async function SubscriptionsPage() {
  requireBrandFeature("subscriptions");
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
