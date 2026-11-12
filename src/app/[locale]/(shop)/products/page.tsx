import type { Metadata } from "next";
import { ProductsListing, productsMetadata } from "@/features/catalog/routes/listingRoutes";

/**
 * All products: title, canonical and hreflang like the other listings
 * (SEO Management can set its own text for "/products"). Prerendered per
 * language; ?sort and price filters apply in the browser, ?page=N is served by
 * ./p/[page] (see lib/i18n/localeRouting).
 */
export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  return productsMetadata(1);
}

export default function ProductsPage() {
  return <ProductsListing page={1} />;
}
