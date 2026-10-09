"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { addCartItems, storefrontCartQuery } from "@/features/cart/api/cart.service";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import type { DiscoveryOffer } from "../types/discovery";
import { rememberEmptyOrigin } from "../utils/emptyBagMemory";
import { trackPromotion } from "../utils/promotionAnalytics";

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

function productPrice(product: ShopProduct, currency: string) {
  const amount = moneyNumber(product.amount);
  return amount == null ? product.price : formatMoney(amount, currency);
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
  const removeSelection = (groupId: string, sku: string) => {
    setSelections((current) => current.filter((item) => !(item.groupId === groupId && item.sku === sku)));
    trackPromotion("promotion_product_removed", {
      campaignId: shop.offer.campaignId,
      campaignCode: shop.offer.campaignCode,
      mechanic: shop.offer.mechanic,
      market: shop.offer.marketCode,
      surface: "offer",
    });
  };
  const unfilled = shop.groups.filter((group) => !groupFilled(group));
  const activeId = unfilled[0]?.id ?? shop.groups[0]?.id;
  const ready = unfilled.length === 0 && Boolean(preview?.readyToAdd) && !adding;
  const subtotal = moneyNumber(preview?.subtotalAmount);
  const savings = moneyNumber(preview?.savingsAmount);
  const total = moneyNumber(preview?.totalAmount);
  const arabic = typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("ar");
  const addPiece = arabic ? "أضف إلى الباقة" : "Add to bundle";
  const addedPiece = arabic ? "تمت الإضافة" : "Added";
  const soldOut = shop.copy.soldOut || (arabic ? "نفد" : "Out of stock");
  const progress = unfilled.length === 0
    ? (preview?.message || (arabic ? "الباقة جاهزة" : "Your bundle is ready"))
    : arabic
      ? `أضف ${unfilled.map((group) => group.name).join("، ")} لإكمال الباقة.`
      : `Add ${unfilled.map((group) => group.name).join(" and ")} to complete your bundle.`;

  return (
    <article className="flex w-full min-w-0 flex-col pb-16">
      <div className="bundle-dock sticky z-30 -mx-[var(--chrome-edge,1rem)] bg-[var(--cream,#faf6ee)] px-[var(--chrome-edge,1rem)] py-3 min-[1200px]:mx-0 min-[1200px]:px-0">
        <div className="grid items-stretch gap-3 min-[900px]:grid-cols-[minmax(0,1fr)_272px]">
          <div className="rounded-2xl bg-[#f3ece4] px-5 py-4">
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h1 className="m-0 shrink-0 font-[family-name:var(--font-display)] text-[2rem] leading-none font-medium tracking-[-0.03em] text-[#1a1a1a]">
                {arabic ? "الباقة." : "Bundle."}
              </h1>
              <p className="m-0 text-[0.95rem] text-[#5e5852]">
                {arabic ? "اختَر ٣ عطور أو أكثر لتوفير أكبر." : "Choose 3+ fragrances for better savings."}
              </p>
            </header>
            <section aria-label={shop.copy.tray}>
              <ol className="m-0 mt-3.5 flex list-none gap-3 p-0">
                {shop.groups.map((group) => {
                  const chosen = selections.find((row) => row.groupId === group.id);
                  const product = chosen ? productsBySku.get(`${group.id}:${chosen.sku}`) : undefined;
                  const current = activeId === group.id && !chosen;
                  return (
                    <li key={group.id} className="w-[7.25rem] shrink-0">
                      {chosen ? (
                        <div className="relative">
                          <span className="grid size-[7.25rem] place-items-center overflow-hidden rounded-xl bg-[#faf7f2]">
                            {product?.image ? <img className="h-full w-full object-contain p-1.5" src={product.image} alt="" /> : null}
                          </span>
                          <button
                            type="button"
                            className="absolute top-1 end-1 grid size-5 cursor-pointer place-items-center rounded-full border-0 bg-white/90 p-0 text-[#1c1917]"
                            aria-label={`${shop.copy.remove} ${product?.title ?? chosen.sku}`}
                            onClick={() => removeSelection(group.id, chosen.sku)}
                          >
                            <svg viewBox="0 0 20 20" className="size-2.5" fill="none" aria-hidden="true">
                              <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <a href={`#offer-group-${group.id}`} className="block text-inherit no-underline">
                          <span className={`grid size-[7.25rem] place-items-center rounded-xl border border-dashed bg-[#faf7f2] text-[#b9aea2] ${current ? "border-[#c4b5a6]" : "border-[#ddd2c6]"}`}>
                            <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
                              <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          </span>
                        </a>
                      )}
                      <p className="m-0 mt-2 line-clamp-2 text-center text-[0.78rem] leading-snug text-[#3d3834]">
                        {product?.title ?? `${shop.copy.choose} ${group.name}`}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
          <aside className="flex flex-col rounded-2xl bg-[#f6f1eb] px-4 pt-4 pb-3.5">
            {subtotal != null && total != null ? (
              <>
                <div className="flex items-baseline justify-between gap-3 text-[0.82rem] text-[#6a625b]">
                  <span>{arabic ? "السعر الأولي" : "Initial price"}</span>
                  <span dir="ltr">{formatMoney(subtotal, currency)}</span>
                </div>
                {savings != null && savings > 0 ? (
                  <div className="mt-2 flex items-baseline justify-between gap-3 text-[0.82rem] font-medium text-copper">
                    <span>{shop.offer.badge || shop.copy.saving || "Discount"}</span>
                    <span dir="ltr">−{formatMoney(savings, currency)}</span>
                  </div>
                ) : (
                  <p className="m-0 mt-2 text-[0.8rem] leading-snug text-[#6f675f]">{progress}</p>
                )}
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-[#e6dcd2] pt-3 text-[0.95rem] font-semibold tracking-[0.04em] text-[#1c1917] uppercase">
                  <span>{arabic ? "المجموع" : "Total"}</span>
                  <span dir="ltr">{formatMoney(total, currency)}</span>
                </div>
              </>
            ) : (
              <p className="m-0 text-[0.85rem] leading-snug text-[#6f675f]">{progress}</p>
            )}
            {addError ? <p className="m-0 mt-2 text-[0.8rem] text-copper" role="alert">{addError}</p> : null}
            <button
              className={`mt-3 flex min-h-11 w-full items-center justify-center rounded-full border-0 px-4 text-[0.8rem] font-semibold tracking-[0.08em] text-white uppercase ${ready ? "cursor-pointer bg-copper hover:bg-copper-deep" : "cursor-not-allowed bg-[#e7b2a8]"}`}
              type="button"
              disabled={!ready}
              onClick={addSelected}
            >
              {shop.copy.add}
            </button>
          </aside>
        </div>
      </div>

      <div className="mt-8 flex min-w-0 flex-col gap-12">
        {shop.groups.map((group) => {
          const full = groupFilled(group);
          return (
            <section key={group.id} id={`offer-group-${group.id}`} aria-label={group.name} className="scroll-mt-[calc(var(--site-header-h,9.25rem)+260px)]">
              <h2 className="m-0 font-[family-name:var(--font-display)] text-[1.35rem] font-normal text-[#2a201a]">{group.name}</h2>
              <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-x-3 gap-y-8 p-0 min-[900px]:grid-cols-4" role="list">
                {group.products.map((product) => {
                  const selected = selections.some((row) => row.groupId === group.id && row.sku === product.sku);
                  const locked = full && !selected;
                  const disabled = !product.inStock || locked;
                  const label = !product.inStock ? soldOut : selected ? addedPiece : addPiece;
                  return (
                    <li key={product.sku} className="flex min-w-0 flex-col">
                      {product.slug ? (
                        <LocaleLink className="text-inherit no-underline" href={`/products/${product.slug}`}>
                          <span className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white">
                            {product.image ? <img className="h-full w-full object-contain p-3" src={product.image} alt="" /> : null}
                          </span>
                          <span className="mt-2.5 line-clamp-2 text-[0.82rem] leading-snug text-[#2a201a]">{product.title}</span>
                        </LocaleLink>
                      ) : (
                        <div>
                          <span className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white">
                            {product.image ? <img className="h-full w-full object-contain p-3" src={product.image} alt="" /> : null}
                          </span>
                          <span className="mt-2.5 line-clamp-2 block text-[0.82rem] leading-snug text-[#2a201a]">{product.title}</span>
                        </div>
                      )}
                      <div className="mt-auto">
                      {productPrice(product, currency) ? <p className="m-0 mt-2 text-[0.82rem] font-semibold text-copper">{productPrice(product, currency)}</p> : null}
                      <button
                        type="button"
                        className={`mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full px-3 text-[0.72rem] font-semibold tracking-[0.06em] uppercase ${
                          selected
                            ? "cursor-pointer border border-copper bg-white text-copper"
                            : disabled
                              ? "cursor-not-allowed border-0 bg-[#efe6dc] text-[#b3a496]"
                              : "cursor-pointer border-0 bg-copper text-white hover:bg-copper-deep"
                        }`}
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() => (selected ? removeSelection(group.id, product.sku) : choose(group, product))}
                      >
                        {label}
                      </button>
                      </div>
                    </li>
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
