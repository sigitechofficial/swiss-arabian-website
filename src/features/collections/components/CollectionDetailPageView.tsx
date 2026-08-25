import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";

/** Static/demo for now: no live collection lookup, just the shared catalog
 *  view (same design as `/products`) seeded from the slug for its heading
 *  copy + hero image. Swap back to the live `fetchCollectionBySlug` /
 *  `fetchCollectionProducts` calls once the real collection catalog API is
 *  ready. */
export function CollectionDetailPageView({ slug }: { slug: string }) {
  return <ProductCatalogView slug={slug} />;
}
