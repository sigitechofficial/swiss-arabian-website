"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
import { useUiStore } from "@/stores/useUiStore";
import { fetchEmptyBag } from "../api/promotions.service";
import type { EmptyBagProduct } from "../types/emptyBag";
import { readViewed } from "../utils/emptyBagMemory";
import {
  related,
  relatedGrid,
  relatedHead,
  relatedTitle,
} from "@/styles/pdpChrome";
import { pageContainer } from "@/styles/siteChrome";

function asCatalog(product: EmptyBagProduct, currency: string): CatalogProduct | null {
  if (!product.productId || !product.slug) return null;
  const amount = product.amount != null ? Number(product.amount) : NaN;
  return toCatalogProduct({
    id: product.productId,
    slug: product.slug,
    title: product.title,
    price: Number.isFinite(amount) ? amount : null,
    currency,
    imageUrl: product.image,
    imageUrls: product.image ? [product.image] : [],
    sku: product.sku,
    isSellable: true,
    concentration: null,
    houseCollection: null,
    featuredNote: null,
  });
}

export function RecentlyViewed({ excludeProductId }: { excludeProductId: string }) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const currency = useUiStore((state) => state.catalogContext?.currencyCode) || "AED";
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readViewed().filter((id) => id && id !== excludeProductId));
  }, [excludeProductId]);

  const query = useQuery({
    queryKey: ["pdp-recently-viewed", zoneCode, ids.join(",")],
    queryFn: () => fetchEmptyBag({ viewedProductIds: ids, scope: "viewed" }),
    enabled: Boolean(zoneCode) && ids.length > 0,
    retry: false,
  });

  const group = query.data?.groups.find((item) => item.id === "viewed");
  const products = (group?.products ?? [])
    .map((product) => asCatalog(product, currency))
    .filter((product): product is CatalogProduct => product != null && product.id !== excludeProductId)
    .slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className={related} aria-labelledby="recently-viewed-heading">
      <div className={pageContainer}>
        <div className={relatedHead}>
          <h2 className={relatedTitle} id="recently-viewed-heading">
            {group?.heading || "Recently viewed."}
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
