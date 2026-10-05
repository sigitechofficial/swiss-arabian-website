"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { addCartItems, storefrontCartQuery } from "@/features/cart/api/cart.service";
import { CatalogProductCard } from "@/features/catalog/components/ProductCatalogView";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import type { DiscoveryOffer } from "../types/discovery";
import { rememberEmptyOrigin } from "../utils/emptyBagMemory";
import { trackPromotion } from "../utils/promotionAnalytics";
import { MoneySummary } from "./MoneySummary";

type ShopProduct = {
  productId: string;
  variantId: string | null;
  sku: string;
  slug: string | null;
  title: string;
  image: string | null;
  price: string | null;
  amount: string | null;
  inStock: boolean;
};

type ShopGroup = {
  id: string;
  name: string;
  requiredQuantity: number | null;
  selectionMode: "replace" | "many";
  products: ShopProduct[];
};

type ShopCopy = {
  choose: string;
  remove: string;
  replace: string;
  tray: string;
  soldOut?: string;
  add: string;
  completed?: string;
  current?: string;
  next?: string;
  before: string;
  saving: string;
  offerSaving?: string;
  otherSavings?: string;
  totalSavings?: string;
  total: string;
  search: string;
};

type ShopPayload = {
  available: true;
  offer: DiscoveryOffer;
  groups: ShopGroup[];
  copy: ShopCopy;
};

type Selection = { groupId: string; sku: string; quantity: number };

type Preview = {
  beforeSavings: string;
  offerSaving?: string | null;
  otherSavings?: string | null;
  totalSavings?: string | null;
  promotionSaving?: string | null;
  yourTotal: string;
  subtotalAmount?: string | null;
  savingsAmount?: string | null;
  totalAmount?: string | null;
  message: string;
  readyToAdd: boolean;
  unavailable: Array<{ groupId: string; sku: string }>;
};

function moneyNumber(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function asCatalog(product: ShopProduct, currency: string): CatalogProduct {
  return toCatalogProduct({
    id: product.productId,
    slug: product.slug || product.sku,
    title: product.title,
    price: moneyNumber(product.amount),
    currency,
    imageUrl: product.image,
    imageUrls: product.image ? [product.image] : [],
    sku: product.sku,
    variantId: product.variantId ?? undefined,
    isSellable: product.inStock,
    concentration: null,
    houseCollection: null,
    featuredNote: null,
  });
}

function ProductFace({ image, empty, current }: { image?: string | null; empty?: boolean; current?: boolean }) {
  const box = "grid aspect-square place-items-center overflow-hidden rounded-xl bg-[#f3ebe0]";
  if (empty || !image) {
    return (
      <span
        className={`${box} border border-dashed border-shop-ink/30 ${current ? "outline outline-2 outline-offset-2 outline-copper" : ""}`}
      />
    );
  }
  return (
    <span className={box}>
      <img className="h-full w-full object-contain" src={image} alt="" />
    </span>
  );
}

function storageKey(market: string, code: string) {
  return `swiss-offer:${market}:${code}`;
}

function readSelections(key: string): Selection[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(key) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const groupId = String((item as { groupId?: unknown }).groupId || "");
      const sku = String((item as { sku?: unknown }).sku || "");
      const quantity = Math.floor(Number((item as { quantity?: unknown }).quantity));
      if (!groupId || !sku || !Number.isFinite(quantity) || quantity < 1) return [];
      return [{ groupId, sku, quantity }];
    });
  } catch {
    return [];
  }
}

function keepSellable(groups: ShopGroup[], rows: Selection[]): Selection[] {
  return rows.flatMap((row) => {
    const group = groups.find((item) => item.id === row.groupId);
    const product = group?.products.find((item) => item.sku === row.sku && item.inStock);
    if (!group || !product) return [];
    const cap = group.requiredQuantity ?? 20;
    return [{ ...row, quantity: Math.min(row.quantity, cap) }];
  });
}

export function OfferShop({ code }: { code: string }) {
  const [shop, setShop] = useState<ShopPayload | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [query, setQuery] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const hydrated = useRef("");
  const opened = useRef(false);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const cartId = useCartStore((state) => state.cartId);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const currency = useUiStore((state) => state.catalogContext?.currencyCode) || "AED";

  useEffect(() => {
    if (!zoneCode) return;
    let cancel = false;
    setShop(null);
    setMissing(false);
    setLoadError(false);
    const params = storefrontCartQuery();
    if (typeof document !== "undefined") params.set("locale", document.documentElement.lang || "en");
    apiGet<ShopPayload | { available: false }>(`/storefront/promotions/offers/${encodeURIComponent(code)}?${params.toString()}`)
      .then((data) => {
        if (cancel) return;
        if (!data || !("offer" in data)) {
          setMissing(true);
          return;
        }
        setShop(data);
      })
      .catch(() => {
        if (!cancel) setLoadError(true);
      });
    return () => {
      cancel = true;
    };
  }, [code, zoneCode]);

  useEffect(() => {
    if (!shop) return;
    const key = storageKey(shop.offer.marketCode, code);
    if (hydrated.current !== key) {
      hydrated.current = key;
      setSelections(keepSellable(shop.groups, readSelections(key)));
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(selections));
  }, [shop, selections, code]);

  useEffect(() => {
    if (!shop || opened.current) return;
    opened.current = true;
    if (shop.offer.mechanic === "SET_BUNDLE") {
      rememberEmptyOrigin(shop.offer.marketCode, shop.offer.campaignCode);
    }
    trackPromotion("promotion_builder_opened", {
      campaignId: shop.offer.campaignId,
      campaignCode: shop.offer.campaignCode,
      mechanic: shop.offer.mechanic,
      market: shop.offer.marketCode,
      brand: null,
      surface: "offer",
    });
  }, [shop]);

  useEffect(() => {
    if (!shop || selections.length === 0) {
      setPreview(null);
      return;
    }
    const handle = window.setTimeout(() => {
      const params = storefrontCartQuery();
      apiPost<Preview | { available: false }>(
        `/storefront/promotions/offers/${encodeURIComponent(code)}/preview?${params.toString()}`,
        {
          locale: document.documentElement.lang || "en",
          selections,
        },
      ).then((data) => {
        if (!data || !("yourTotal" in data)) return;
        setPreview(data);
        if (data.unavailable.length) {
          setSelections((current) => current.filter((row) =>
            !data.unavailable.some((gone) => gone.groupId === row.groupId && gone.sku === row.sku),
          ));
        }
      }).catch(() => setPreview(null));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [shop, selections, code]);

  const productsBySku = useMemo(() => {
    const map = new Map<string, ShopProduct>();
    for (const group of shop?.groups ?? []) {
      for (const product of group.products) map.set(`${group.id}:${product.sku}`, product);
    }
    return map;
  }, [shop]);

  if (!zoneCode || (!shop && !missing && !loadError)) return <p>Loading.</p>;
  if (loadError) return <p>We could not load this page.</p>;
  if (missing || !shop) return <p>This is not available in your market.</p>;
  const page = shop;

  function choose(group: ShopGroup, product: ShopProduct) {
    if (!product.inStock) return;
    setSelections((current) => {
      const rest = group.selectionMode === "replace"
        ? current.filter((row) => row.groupId !== group.id)
        : current.filter((row) => !(row.groupId === group.id && row.sku === product.sku));
      return [...rest, { groupId: group.id, sku: product.sku, quantity: 1 }];
    });
    trackPromotion("promotion_product_selected", {
      campaignId: page.offer.campaignId,
      campaignCode: page.offer.campaignCode,
      mechanic: page.offer.mechanic,
      market: page.offer.marketCode,
      surface: "offer",
    });
  }

  async function addSelected() {
    if (!preview?.readyToAdd || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const cart = await addCartItems(
        selections.map((row) => ({ sku: row.sku, quantity: row.quantity })),
        cartId,
      );
      setCartFromApi(cart);
      setCartOpen(true);
      trackPromotion("promotion_multi_add", {
        campaignId: page.offer.campaignId,
        campaignCode: page.offer.campaignCode,
        mechanic: page.offer.mechanic,
        market: page.offer.marketCode,
        surface: "offer",
      });
    } catch {
      setAddError(page.copy.add);
    } finally {
      setAdding(false);
    }
  }

  const groupFilled = (group: ShopGroup) => {
    const have = selections
      .filter((row) => row.groupId === group.id)
      .reduce((sum, row) => sum + row.quantity, 0);
    return group.requiredQuantity ? have >= group.requiredQuantity : have > 0;
  };
  const activeId = shop.groups.find((group) => !groupFilled(group))?.id ?? shop.groups[0]?.id;
  const ready = Boolean(preview?.readyToAdd) && !adding;
  const subtotal = moneyNumber(preview?.subtotalAmount);
  const savings = moneyNumber(preview?.savingsAmount);
  const total = moneyNumber(preview?.totalAmount);

  return (
    <article className="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-clip pb-24 [&>*]:min-w-0 min-[960px]:grid min-[960px]:grid-cols-[minmax(0,1fr)_340px] min-[960px]:items-start min-[960px]:gap-x-9 [&_h1]:m-0 [&_h1]:font-medium [&_h2]:m-0 [&_h2]:font-medium">
      <header className="min-[960px]:col-start-1 [&_h1]:text-[clamp(1.6rem,3vw,2.2rem)] [&_h1]:leading-[1.15] [&_p]:m-0">
        {shop.offer.badge ? <p className="text-xs tracking-[0.08em] text-copper uppercase">{shop.offer.badge}</p> : null}
        <h1>{shop.offer.publicTitle}</h1>
        {shop.offer.shortMessage ? <p>{shop.offer.shortMessage}</p> : null}
      </header>
      <section className="min-[960px]:col-start-1 [&_a]:grid [&_a]:gap-2 [&_a]:text-inherit [&_a]:no-underline [&_button]:cursor-pointer [&_button]:justify-self-start [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:font-[inherit] [&_button]:text-shop-ink/60! [&_button]:underline! [&_li]:grid [&_li]:w-[148px] [&_li]:shrink-0 [&_li]:content-start [&_li]:gap-2 [&_strong]:line-clamp-2 [&_strong]:font-medium [&_ul]:mt-3 [&_ul]:flex [&_ul]:w-full [&_ul]:list-none [&_ul]:gap-3 [&_ul]:overflow-x-auto [&_ul]:p-0 [&_ul]:pb-2" aria-label={shop.copy.tray}>
        <h2>{shop.copy.tray}</h2>
        <ul>
          {shop.groups.flatMap((group) => {
            const chosen = selections.filter((row) => row.groupId === group.id);
            const done = groupFilled(group);
            const tiles = chosen.map((row) => {
              const product = productsBySku.get(`${row.groupId}:${row.sku}`);
              return (
                <li key={`${group.id}-${row.sku}`}>
                  <ProductFace image={product?.image} />
                  <strong>{product?.title ?? row.sku}</strong>
                  {group.selectionMode === "many" && (group.requiredQuantity == null || group.requiredQuantity > 1) ? (
                    <input
                      className="min-h-11 w-[72px] font-[inherit]"
                      type="number"
                      min={1}
                      max={group.requiredQuantity ?? 20}
                      value={row.quantity}
                      aria-label={group.name}
                      onChange={(event) => {
                        const quantity = Math.floor(Number(event.target.value));
                        if (!Number.isFinite(quantity) || quantity < 1) return;
                        setSelections((current) => current.map((item) =>
                          item.groupId === row.groupId && item.sku === row.sku
                            ? { ...item, quantity: Math.min(quantity, group.requiredQuantity ?? 20) }
                            : item,
                        ));
                      }}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelections((current) => current.filter((item) => !(item.groupId === row.groupId && item.sku === row.sku)));
                      trackPromotion("promotion_product_removed", {
                        campaignId: shop.offer.campaignId,
                        campaignCode: shop.offer.campaignCode,
                        mechanic: shop.offer.mechanic,
                        market: shop.offer.marketCode,
                        surface: "offer",
                      });
                    }}
                  >
                    {shop.copy.remove}
                  </button>
                </li>
              );
            });
            if (!done) {
              tiles.push(
                <li key={`${group.id}-empty`}>
                  <a href={`#offer-group-${group.id}`}>
                    <ProductFace empty current={activeId === group.id} />
                    <strong>{shop.copy.choose} {group.name}</strong>
                  </a>
                </li>,
              );
            }
            return tiles;
          })}
        </ul>
      </section>
      <aside className="cart-summary min-w-0 self-start max-[959px]:order-3 min-[960px]:col-start-2 min-[960px]:row-span-3">
        <h2>Summary</h2>
        {subtotal != null && savings != null && total != null ? (
          <MoneySummary
            className="cart-totals"
            currency={currency}
            subtotal={subtotal}
            discount={savings}
            shippingDiscount={0}
            total={total}
          />
        ) : null}
        {preview?.message ? <p className="m-0 text-base">{preview.message}</p> : null}
        {addError ? <p role="alert">{addError}</p> : null}
        <button className={ready ? "cart-cta" : "cart-cta is-disabled"} type="button" disabled={!ready} onClick={addSelected}>
          {shop.copy.add}
        </button>
      </aside>
      <div className="max-[959px]:order-4 min-[960px]:col-start-1">
        {shop.groups.map((group) => {
          const needle = (query[group.id] || "").trim().toLowerCase();
          const visible = group.products.filter((product) => !needle || product.title.toLowerCase().includes(needle));
          return (
            <section
              key={group.id}
              id={`offer-group-${group.id}`}
              aria-label={group.name}
              aria-current={activeId === group.id ? "true" : undefined}
              className={activeId === group.id ? "grid-band products-band scroll-mt-[8.5rem]" : "grid-band products-band"}
            >
              <div className="grid gap-3 min-[720px]:grid-cols-[1fr_minmax(180px,260px)] min-[720px]:items-center">
                <h2>
                  {group.name}
                  {group.requiredQuantity && group.requiredQuantity > 1 ? ` · ${group.requiredQuantity}` : ""}
                </h2>
                <label>
                  <span className="absolute h-px w-px overflow-hidden [clip:rect(0,0,0,0)]">{shop.copy.search}</span>
                  <input
                    className="min-h-11 w-full rounded-full border border-shop-ink/15 bg-sand px-4 font-[inherit]"
                    value={query[group.id] || ""}
                    placeholder={shop.copy.search}
                    onChange={(event) => setQuery((current) => ({ ...current, [group.id]: event.target.value }))}
                  />
                </label>
              </div>
              <ul className="product-grid ![grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr))]" role="list">
                {visible.map((product) => {
                  const selected = selections.some((row) => row.groupId === group.id && row.sku === product.sku);
                  return (
                    <CatalogProductCard
                      key={product.sku}
                      product={asCatalog(product, currency)}
                      hideAdd={!product.inStock}
                      note={product.inStock ? undefined : (shop.copy.soldOut || "Out of stock")}
                      addControl={
                        <button
                          className="product-card__add"
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${selected ? shop.copy.replace : shop.copy.choose} ${product.title}`}
                          disabled={!product.inStock}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            choose(group, product);
                          }}
                        >
                          <svg className="product-card__add-plus" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                            <path d="M10 4v12M4 10h12" />
                          </svg>
                          <svg className="product-card__add-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                            <path d="M5 10.5 8.5 14 15 7" />
                          </svg>
                        </button>
                      }
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
}
