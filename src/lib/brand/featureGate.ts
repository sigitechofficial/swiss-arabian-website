import { notFound } from "next/navigation";
import { brandFeatureEnabled, brandFeatures, type BrandFeature, type BrandFeatures } from "./features";

/**
 * Route guard (server): a page of a switched-off section answers "not found".
 * Call it first in the page (and in `generateMetadata` when that fetches data).
 * The proxy already answers 404 for these addresses; this also covers renders
 * the proxy does not see (prerendering, a route reached another way).
 */
export function requireBrandFeature(feature: BrandFeature, features: BrandFeatures = brandFeatures()): void {
  if (!brandFeatureEnabled(feature, features)) notFound();
}
