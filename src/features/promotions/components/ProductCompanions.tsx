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
import { MoneySummary } from "./MoneySummary";

function amountOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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
        <section className="pdp-bundle" aria-labelledby="companion-heading">
          <div className="container container--full">
            <div className="pdp-bundle__head">
              <div>
                <p className="pdp-bundle__eyebrow">Often bought together</p>
                <h2 id="companion-heading">{bundle.heading}</h2>
              </div>
              {fresh?.message ? <p>{fresh.message}</p> : null}
            </div>
            <div className="pdp-bundle__layout">
              <ul className="pdp-bundle__pieces">
                {pieces.map((product) => {
                  const current = product.sku === data.current?.sku;
                  return (
                    <li key={product.sku} className={selected.includes(product.sku) ? "is-selected" : undefined}>
                      <label>
                        <span>{current ? data.copy.thisProduct : data.copy.addSelected}</span>
                        <input
                          type="checkbox"
                          checked={selected.includes(product.sku)}
                          disabled={!product.inStock}
                          aria-label={`${current ? data.copy.thisProduct : data.copy.addSelected} ${product.title}`}
                          onChange={() => toggle(product.sku)}
                        />
                      </label>
                      {product.slug ? (
                        <Link href={`/products/${product.slug}`}>
                          {product.image ? <img src={product.image} alt="" /> : <span className="bottle" aria-hidden="true" />}
                        </Link>
                      ) : product.image ? (
                        <img src={product.image} alt="" />
                      ) : (
                        <span className="bottle" aria-hidden="true" />
                      )}
                      <h3>{product.title}</h3>
                      {product.price ? <p>{product.price}</p> : null}
                    </li>
                  );
                })}
              </ul>
              <aside className="cart-summary">
                <h2>Summary</h2>
                {subtotal != null && total != null && discount != null ? (
                  <MoneySummary
                    className="cart-totals"
                    currency={currency}
                    subtotal={subtotal}
                    discount={discount}
                    shippingDiscount={0}
                    total={total}
                  />
                ) : null}
                {fresh?.message ? <p className="pdp-bundle__note">{fresh.message}</p> : null}
                <button
                  className={ready ? "cart-cta" : "cart-cta is-disabled"}
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
        <section className="pdp-related" key={group.id}>
          <div className="container container--full">
            <div className="pdp-related__head">
              <h2 className="pdp-related__title">{group.heading}</h2>
              {group.seeAllPath ? (
                <Link className="pdp-related__all" href={group.seeAllPath}>
                  {data.copy.seeAll}
                </Link>
              ) : null}
            </div>
            <ul className="pdp-related__grid products-band" role="list">
              {group.products.map((product) => (
                <li className="product-card" key={product.sku}>
                  {product.slug ? (
                    <Link className="product-card__media-link" href={`/products/${product.slug}`}>
                      {product.image ? <img src={product.image} alt="" width={600} height={600} /> : <span className="bottle" aria-hidden="true" />}
                    </Link>
                  ) : null}
                  <div className="product-card__body">
                    <h3 className="product-card__name">{product.title}</h3>
                    {product.price ? <p className="product-card__price">{product.price}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </>
  );
}
