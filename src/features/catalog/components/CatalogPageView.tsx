"use client";

import { ProductCatalogView } from "./ProductCatalogView";

/** Static/demo for now: renders the same catalog design as a collection
 *  page, unfiltered ("All products"). Swap back to the live `fetchProducts`
 *  call once the real catalog API is ready. */
export function CatalogPageView() {
  return <ProductCatalogView />;
}
