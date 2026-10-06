"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { addCartItems } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchProductCompanions, previewProductCompanions } from "../api/promotions.service";
import type { CompanionProduct } from "../types/companions";
import { trackPromotion } from "../utils/promotionAnalytics";
import { bottle } from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";
import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { MoneySummary } from "./MoneySummary";
import {
  cartCta,
  cartCtaDisabled,
  cartSummary,
  cartSummaryTitle,
  cartTotals,
} from "@/styles/cartChrome";
import {
  related,
  relatedAll,
  relatedGrid,
  relatedHead,
  relatedTitle,
} from "@/styles/pdpChrome";

function amountOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function companionCard(product: CompanionProduct, currency: string): CatalogProduct | null {
  if (!product.slug) return null;
  return toCatalogProduct({
    id: product.productId,
    slug: product.slug,
    title: product.title,
    price: amountOf(product.amount) ?? amountOf(product.price),
    currency,
    imageUrl: product.image,
    imageUrls: product.image ? [product.image] : [],
    sku: product.sku,
    isSellable: product.inStock,
    inStock: product.inStock,
    concentration: null,
    houseCollection: null,
    featuredNote: null,
  });
}

function pieceCardClass(on: boolean, inStock: boolean) {
  const base =
    "group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-2 transition-[border-color,box-shadow,background-color] duration-200";
  if (!inStock) return `${base} cursor-not-allowed border-[#241f1b]/10 opacity-50`;
  if (on) {
    return `${base} border-copper bg-[#fffaf6] shadow-[0_0_0_1px_#8c4435,0_16px_36px_rgba(140,68,53,0.16)]`;
  }
  return `${base} border-[#241f1b]/10 shadow-[0_8px_22px_rgba(60,40,25,0.05)] hover:border-copper/45 hover:shadow-[0_14px_30px_rgba(140,68,53,0.12)]`;
}

function SelectMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-full border border-[#241f1b]/18 bg-white text-transparent shadow-[0_1px_2px_rgba(36,31,27,0.06)] transition-colors peer-checked:border-copper peer-checked:bg-copper peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-copper/35 peer-disabled:opacity-40"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M3.2 8.2 6.4 11.2 12.8 4.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function ProductCompanions({
  productId,
  marketCode,
  fallback,
  omitGroupIds = [],
}: {
  productId: string;
  marketCode?: string | null;
  fallback: ReactNode;
  /** Merch already renders these groups, so the companion copy is left out. */
  omitGroupIds?: string[];
}) {
  const query = useQuery({
    queryKey: ["promotion-companions", productId, marketCode ?? ""],
    queryFn: () => fetchProductCompanions(productId),
    enabled: Boolean(productId),
    retry: false,
  });
  const data = query.data;
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const currency = useUiStore((state) => state.catalogContext?.currencyCode) || "AED";
  const [selected, setSelected] = useState<string[]>([]);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ key: string; before: string | null; saving: string | null; total: string | null; message: string | null; ready: boolean } | null>(null);

  useEffect(() => {
    if (!data || seededFor === productId) return;
    setSelected(data.current?.inStock ? [data.current.sku] : []);
    setSeededFor(productId);
  }, [data, productId, seededFor]);

  const products = useMemo(() => {
    const rows = new Map<string, CompanionProduct>();
    if (data?.current) rows.set(data.current.sku, data.current);
    for (const group of data?.groups ?? []) {
      for (const product of group.products) rows.set(product.sku, product);
    }
    return rows;
  }, [data]);

  const chosen = selected.filter((sku) => products.get(sku)?.inStock);
  const selectionKey = chosen.slice().sort().join(",");

  useEffect(() => {
    if (!chosen.length) {
      setPreview(null);
      return;
    }
    let cancel = false;
    const timer = window.setTimeout(() => {
      void previewProductCompanions(productId, chosen.map((sku) => ({ sku }))).then((result) => {
        if (cancel) return;
        setPreview({
          key: selectionKey,
          before: result.beforeSavings,
          saving: result.promotionSaving,
          total: result.yourTotal,
          message: result.message,
          ready: result.readyToAdd,
        });
      });
    }, 200);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [productId, selectionKey]);

  const groups = (data?.groups ?? []).filter((group) => !omitGroupIds.includes(group.id));
  if (query.isPending) return null;
  if (query.isError || !data || groups.length === 0) return <>{fallback}</>;

  const fresh = preview?.key === selectionKey ? preview : null;

  function toggle(sku: string) {
    const product = products.get(sku);
    if (!product?.inStock) return;
    setSelected((current) => {
      const next = current.includes(sku) ? current.filter((item) => item !== sku) : [...current, sku];
      trackPromotion(next.includes(sku) ? "promotion_product_selected" : "promotion_product_removed", {
        market: marketCode,
        surface: "pdp",
      });
      return next;
    });
  }

  const bundle = groups[0];
  const later = groups.slice(1);
  const pieces = [
    ...(data.current?.inStock ? [data.current] : []),
    ...(bundle?.products ?? []).filter((product) => product.sku !== data.current?.sku),
  ];
  const subtotal = amountOf(fresh?.before);
  const total = amountOf(fresh?.total);
  const discount =
    subtotal != null && total != null ? Math.max(0, Number((subtotal - total).toFixed(2))) : null;
  const ready = Boolean(fresh?.ready) && !busy && chosen.length > 0;

  return (
    <>
      {bundle && pieces.length > 0 ? (
        <section className="bg-warm py-16" aria-labelledby="companion-heading">
          <div className={pageContainer}>
            <div className="mb-8 flex items-end justify-between gap-6 max-[900px]:grid max-[900px]:grid-cols-1 [&_h2]:m-0 [&_h2]:text-[clamp(1.6rem,3vw,2.2rem)] [&_h2]:font-medium">
              <div>
                <p className="m-0 mb-1.5 text-[0.72rem] font-bold tracking-[0.08em] text-copper uppercase">Often bought together</p>
                <h2 id="companion-heading">{bundle.heading}</h2>
              </div>
              {fresh?.message ? <p className="m-0">{fresh.message}</p> : null}
            </div>
            <div className="grid items-start gap-5 max-[900px]:grid-cols-1 min-[901px]:grid-cols-[minmax(0,1fr)_300px]">
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 p-0">
                {pieces.map((product) => {
                  const current = product.sku === data.current?.sku;
                  const on = selected.includes(product.sku);
                  const label = current ? data.copy.thisProduct : data.copy.addSelected;
                  const media = product.image ? (
                    <img src={product.image} alt="" className="aspect-square w-full object-contain p-3" />
                  ) : (
                    <span className={`${bottle} aspect-square w-full`} aria-hidden="true" />
                  );
                  return (
                    <li key={product.sku} className={pieceCardClass(on, product.inStock)}>
                      <label className={`flex items-center justify-between gap-2 px-1.5 py-1 ${product.inStock ? "cursor-pointer" : "cursor-not-allowed"}`}>
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={on}
                          disabled={!product.inStock}
                          aria-label={`${label} ${product.title}`}
                          onChange={() => toggle(product.sku)}
                        />
                        <span className={`text-[0.68rem] font-bold tracking-[0.08em] uppercase transition-colors ${on ? "text-copper" : "text-[#6f6152]"}`}>
                          {label}
                        </span>
                        <SelectMark />
                      </label>
                      {product.slug ? (
                        <Link href={`/products/${product.slug}`} className="mx-1 block overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f1e7d4_100%)]">
                          {media}
                        </Link>
                      ) : (
                        <span className="mx-1 block overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f1e7d4_100%)]">
                          {media}
                        </span>
                      )}
                      <div className="flex flex-1 flex-col gap-1 px-2 pt-3 pb-2">
                        <h3 className="m-0 font-[family-name:var(--font-display)] text-[0.98rem] leading-snug text-[#2a201a]">{product.title}</h3>
                        {product.price ? <p className="m-0 text-[0.85rem] font-semibold text-copper">{product.price}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <aside className={cartSummary}>
                <h2 className={cartSummaryTitle}>Summary</h2>
                {subtotal != null && total != null && discount != null ? (
                  <MoneySummary
                    className={cartTotals}
                    currency={currency}
                    subtotal={subtotal}
                    discount={discount}
                    shippingDiscount={0}
                    total={total}
                  />
                ) : null}
                {fresh?.message ? <p className="mb-3 text-[0.85rem]">{fresh.message}</p> : null}
                <button
                  className={ready ? cartCta : `${cartCta} ${cartCtaDisabled}`}
                  type="button"
                  disabled={!ready}
                  onClick={() => {
                    if (!ready) return;
                    setBusy(true);
                    void addCartItems(chosen.map((sku) => ({ sku, quantity: 1 })), cartId)
                      .then((cart) => {
                        setCartFromApi(cart);
                        setCartOpen(true);
                        trackPromotion("promotion_multi_add", { market: marketCode, surface: "pdp" });
                      })
                      .finally(() => setBusy(false));
                  }}
                >
                  {data.copy.addSelected}
                </button>
              </aside>
            </div>
          </div>
        </section>
      ) : null}
      {later.map((group) => (
        <section className={related} key={group.id}>
          <div className={pageContainer}>
            <div className={relatedHead}>
              <h2 className={relatedTitle}>{group.heading}</h2>
              {group.seeAllPath ? (
                <Link className={relatedAll} href={group.seeAllPath}>
                  {data.copy.seeAll}
                </Link>
              ) : null}
            </div>
            <ul className={relatedGrid} role="list">
              {group.products.map((product) => {
                const card = companionCard(product, currency);
                if (!card) return null;
                return (
                  <CatalogProductCard
                    key={product.sku}
                    product={card}
                    dense={false}
                    hideAdd={!product.inStock}
                  />
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </>
  );
}
