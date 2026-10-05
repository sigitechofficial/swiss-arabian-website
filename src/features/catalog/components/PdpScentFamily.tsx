"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/catalog.service";
import type { CatalogProduct } from "../constants/catalogProducts";
import { toCatalogProduct } from "../utils/toCatalogProduct";

export function PdpScentFamily({
  current,
  familyCode,
  zoneCode,
  fallback,
}: {
  current: CatalogProduct;
  familyCode: string | null;
  zoneCode: string;
  fallback: CatalogProduct[];
}) {
  const query = useQuery({
    queryKey: ["pdp-scent-family", zoneCode, familyCode ?? ""],
    queryFn: () =>
      fetchProducts(zoneCode, {
        fragranceFamily: familyCode ?? undefined,
        page: 1,
        limit: 8,
        onlySellable: true,
      }),
    enabled: Boolean(zoneCode && familyCode),
    retry: false,
  });

  const fromFamily = (query.data?.products ?? [])
    .map((product) => toCatalogProduct(product))
    .filter((product) => product.slug);
  const pool = fromFamily.length > 1 ? fromFamily : fallback;
  const seen = new Set<string>();
  const items = [current, ...pool.filter((product) => product.id !== current.id)]
    .filter((product) => {
      if (!product.slug || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .slice(0, 6);

  if (items.length < 2) return null;

  return (
    <section className="pdp-scents" aria-labelledby="pdp-scents-heading">
      <p className="pdp-scents__label" id="pdp-scents-heading">
        Scent: <strong>{current.title}</strong>
      </p>
      <ul>
        {items.map((product) => {
          const active = product.id === current.id;
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                aria-current={active ? "true" : undefined}
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" />
                ) : (
                  <span className="bottle" aria-hidden="true" />
                )}
                <span>{product.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
