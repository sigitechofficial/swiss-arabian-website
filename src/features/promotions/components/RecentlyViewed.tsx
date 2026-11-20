"use client";

import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
import { related, relatedGrid, relatedHead, relatedTitle } from "@/styles/pdpChrome";
import { pageContainer } from "@/styles/siteChrome";
import { useRecentlyViewedProducts } from "../hooks/useRecentlyViewedProducts";

/** Swiss Arabian's "Recently viewed" row on the product page (data: useRecentlyViewedProducts). */
export function RecentlyViewed({ excludeProductId }: { excludeProductId: string }) {
  const { products, heading } = useRecentlyViewedProducts(excludeProductId);
  if (products.length === 0) return null;

  return (
    <section className={related} aria-labelledby="recently-viewed-heading">
      <div className={pageContainer}>
        <div className={relatedHead}>
          <h2 className={relatedTitle} id="recently-viewed-heading">
            {heading || "Recently viewed."}
          </h2>
        </div>
        <ul className={relatedGrid} role="list">
          {products.map((product) => (
            <CatalogProductCard key={product.id} product={product} dense={false} />
          ))}
        </ul>
      </div>
    </section>
  );
}
