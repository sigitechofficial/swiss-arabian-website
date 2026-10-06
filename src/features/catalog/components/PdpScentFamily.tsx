"use client";

import Link from "next/link";
import { bottle } from "@/styles/landingChrome";
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
    <section className="m-0 min-w-0" aria-labelledby="pdp-scents-heading">
      <p className="mb-3 text-[0.95rem]" id="pdp-scents-heading">
        Scent: <strong>{current.title}</strong>
      </p>
      <ul className="m-0 flex w-full min-w-0 list-none flex-wrap items-start gap-3 p-0">
        {items.map((product) => {
          const active = product.id === current.id;
          return (
            <li className="w-[92px] shrink-0" key={product.id}>
              <Link
                className="grid gap-1.5 text-xs leading-snug text-inherit no-underline aria-[current=true]:[&>:first-child]:border-2 aria-[current=true]:[&>:first-child]:border-copper"
                href={`/products/${product.slug}`}
                aria-current={active ? "true" : undefined}
              >
                {product.imageUrl ? (
                  <img className="aspect-square w-full rounded-lg border border-[#241f1b]/12 bg-white object-contain" src={product.imageUrl} alt="" />
                ) : (
                  <span className={`${bottle} aspect-square w-full rounded-lg border border-[#241f1b]/12 bg-white`} aria-hidden="true" />
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
