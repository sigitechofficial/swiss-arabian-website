"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { setQuantityOptimistic, useAddToCart } from "@/features/cart";
import { PageLoading } from "@/components/ui";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { ensureInsiderProductPage } from "@/lib/insider";
import { useMarket } from "@/providers/MarketProvider";
import { catalogKeys, fetchCollectionProducts, fetchProductBySlug } from "../api/catalog.service";
import { toCatalogProduct } from "../utils/toCatalogProduct";
import { MERCH_RAIL_SLUGS, pickMoreFromCollection, useMerchRail } from "@/features/merchandising";
import { useLoadedImages } from "../hooks/useLoadedImages";
import {
  CATALOG_PRODUCTS,
  COLLECTION_LABELS,
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "../constants/catalogProducts";
import { OfferCountLink, PdpOffersPanel } from "@/features/promotions/components/PromotionOffers";
import { ProductCompanions } from "@/features/promotions/components/ProductCompanions";
import { RecentlyViewed } from "@/features/promotions/components/RecentlyViewed";
import { OutOfStockAlternatives } from "@/features/promotions/components/OutOfStockAlternatives";
import { rememberViewedProduct } from "@/features/promotions/utils/emptyBagMemory";
import { PdpReviews } from "./PdpReviews";
import { PdpScentFamily } from "./PdpScentFamily";
import { ProductCardTags } from "./ProductCardTags";
import {
  familyChips,
  notesSectionTitle,
  pyramidFromMetafields,
} from "../utils/pdpMetafields";
import { reviewStarsLabel } from "../utils/pdpReviews";
import {
  shippingDaysLine,
  shippingTabCopy,
  shippingThresholdLine,
} from "../utils/pdpShipping";
import {
  PRODUCT_DETAIL_CONTENT,
  noteDotColor,
  type ProductDetailContent,
} from "../constants/productDetailContent";

const FALLBACK_CONTENT: ProductDetailContent = {
  story: "Composed in Dubai since 1974 — a Swiss Arabian signature, worn on its own or layered.",
  notes: [
    { level: "Top", names: "Bergamot · Pink Pepper", bar: 42 },
    { level: "Heart", names: "Rose · Amber", bar: 68 },
    { level: "Base", names: "Musk · Wood", bar: 92 },
  ],
  wear: "Apply to pulse points — wrists, the base of the throat, behind the ears. An extrait is concentrated: two touches carry through the day.",
  shipping: "",
  authenticity:
    "Composed, filled and finished by Swiss Arabian in Dubai. Every bottle ships from our warehouse with its batch code intact.",
};

const TABS = [
  { id: "story", label: "Story" },
  { id: "notes", label: "Notes" },
  { id: "details", label: "Details" },
  { id: "wear", label: "How to wear" },
  { id: "ship", label: "Shipping" },
  { id: "auth", label: "Authenticity" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function productCode(product: CatalogProduct): string {
  if (product.sku?.trim()) return product.sku.trim();
  const base = product.title.replace(/\s+/g, "").toUpperCase();
  const size = product.concentration === "extrait" ? "EXT50" : "EDP100";
  return `SA-${base}-${size}`;
}

function cartLineForProduct(
  lines: CartLine[],
  product: CatalogProduct,
): CartLine | undefined {
  const keys = [product.variantId, product.sku, product.slug].filter(
    (key): key is string => Boolean(key?.trim()),
  );
  return lines.find(
    (line) => keys.includes(line.variantId) || line.slug === product.slug,
  );
}

export function ProductDetailPageView({ slug }: { slug: string }) {
  const { marketId } = useMarket();
  const zoneCode = marketId ?? "";

  // Wait for the real market. The default "UAE" code is not the live zone,
  // and a fetch against it reports a real product as missing.
  const { data: apiProduct, isPending } = useQuery({
    queryKey: catalogKeys.detail(slug, zoneCode),
    queryFn: () => fetchProductBySlug(slug, zoneCode),
    enabled: Boolean(slug && zoneCode),
  });

  const staticProduct = useMemo(
    () => CATALOG_PRODUCTS.find((p) => p.slug === slug),
    [slug],
  );

  // Prefer live data; keep the static entry as the fallback so the designed
  // house products keep rendering exactly as they do today.
  const product = useMemo(
    () => (apiProduct ? toCatalogProduct(apiProduct) : staticProduct),
    [apiProduct, staticProduct],
  );

  const authoredContent = (slug && PRODUCT_DETAIL_CONTENT[slug]) || null;
  const livePyramid = useMemo(
    () => pyramidFromMetafields(apiProduct?.pdpMetafields),
    [apiProduct],
  );
  const metafields = apiProduct?.pdpMetafields;
  const shippingPromise = apiProduct?.shippingPromise ?? null;
  const pdpReviews = apiProduct?.reviews ?? null;
  const reviewSummary = pdpReviews?.summary;
  const showReviewRating = Boolean(reviewSummary && reviewSummary.reviewCount > 0);
  const daysLine = shippingPromise ? shippingDaysLine(shippingPromise) : null;
  const thresholdLine = shippingPromise ? shippingThresholdLine(shippingPromise) : null;
  const liveShippingCopy = shippingTabCopy(shippingPromise);
  const compositionTabs = useMemo(() => {
    const showNotes =
      livePyramid.length > 0 || Boolean(authoredContent?.notes.length);
    return TABS.filter((tab) => {
      if (tab.id === "notes") return showNotes;
      if (tab.id === "ship") return Boolean(liveShippingCopy);
      return true;
    });
  }, [authoredContent, livePyramid.length, liveShippingCopy]);

  const content = useMemo<ProductDetailContent>(() => {
    const base = authoredContent ?? FALLBACK_CONTENT;
    const shipping = liveShippingCopy ?? "";
    if (authoredContent) return { ...base, shipping };
    const apiStory = apiProduct?.description?.trim();
    return apiStory ? { ...base, story: apiStory, shipping } : { ...base, shipping };
  }, [authoredContent, apiProduct, liveShippingCopy]);

  const [activeImage, setActiveImage] = useState(0);
  const [prVideoOpen, setPrVideoOpen] = useState(true);
  const [prVideoExpanded, setPrVideoExpanded] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  // Live catalog media 404s for some products; drop those sources so the hero
  // and thumbs never render a broken-image icon.
  const [failedImages, setFailedImages] = useState<string[]>([]);

  useEffect(() => {
    setPrVideoOpen(true);
    setPrVideoExpanded(false);
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    const category =
      apiProduct?.collections?.find((collection) => collection.isFeatured)?.name ||
      apiProduct?.collections?.[0]?.name ||
      product.houseCollection ||
      null;
    ensureInsiderProductPage({
      id: product.variantId || product.id,
      sku: product.sku || product.variantId || product.id,
      name: product.title,
      price: product.price ?? 0,
      currency: product.currency || "AED",
      imageUrl: product.imageUrl ?? product.imageUrls?.[0] ?? null,
      category,
      brand: apiProduct?.brandName ?? null,
      stock: product.availableQty ?? (product.inStock === false ? 0 : 1),
      size: product.subtitle,
      groupcode: product.id,
    });
  }, [apiProduct, product]);
  const [activeTab, setActiveTab] = useState<TabId | null>("notes");
  const [tabsPaused, setTabsPaused] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const lines = useCartStore((s) => s.lines);
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const cartLine = useMemo(
    () => (product ? cartLineForProduct(lines, product) : undefined),
    [lines, product],
  );
  const displayQty = cartLine ? cartLine.quantity : quantity;
  const [wished, setWished] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState("");
  const [buyDocked, setBuyDocked] = useState(false);
  const [buyBarHeight, setBuyBarHeight] = useState<number | null>(null);
  const buySlotRef = useRef<HTMLDivElement>(null);
  const buyBarRef = useRef<HTMLDivElement>(null);

  const { addToCart } = useAddToCart();

  // Mobile buy dock — same behaviour as v5/detail.html: pin the *same*
  // Add-to-bag row to the viewport bottom while its natural slot is still
  // below the fold (so it stays reachable while scrolling the product
  // image/copy), then release it back into flow the moment the slot
  // reaches the bottom edge. From there it scrolls up with `.pdp-hero`
  // and disappears when the next section starts — never a page-wide
  // permanent fixed bar. Desktop is untouched.
  useEffect(() => {
    const slot = buySlotRef.current;
    const bar = buyBarRef.current;
    if (!slot || !bar || typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 767px)");

    const measure = () => {
      const h = bar.getBoundingClientRect().height;
      if (h) setBuyBarHeight(h);
      return h;
    };

    const syncDock = () => {
      if (!mq.matches) {
        setBuyDocked(false);
        return;
      }
      const h = measure() || 72;
      setBuyDocked(slot.getBoundingClientRect().top > window.innerHeight - h + 1);
    };

    syncDock();
    window.addEventListener("scroll", syncDock, { passive: true });
    window.addEventListener("resize", syncDock);
    mq.addEventListener("change", syncDock);
    const resize = new ResizeObserver(syncDock);
    resize.observe(bar);

    return () => {
      window.removeEventListener("scroll", syncDock);
      window.removeEventListener("resize", syncDock);
      mq.removeEventListener("change", syncDock);
      resize.disconnect();
    };
  }, [slug]);

  // The composition block renders as tabs on desktop (one panel must stay
  // open) but collapses into an accordion below 767px (`.pdp-comp-tabs {
  // display: none }` in v5-detail.css) — on that layout every item should
  // start closed. `useLayoutEffect` (not `useEffect`) so this resolves
  // before the first paint and the "Notes" panel never visibly flashes
  // open first.
  useLayoutEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    setActiveTab(isMobile ? null : compositionTabs[0]?.id ?? "story");
  }, [slug, compositionTabs]);

  useEffect(() => {
    if (apiProduct?.id) rememberViewedProduct(apiProduct.id);
  }, [apiProduct?.id]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setWished(false);
    setStatus("");
    setTabsPaused(false);
  }, [slug]);

  useEffect(() => {
    const thumb = thumbsRef.current?.querySelector<HTMLElement>(
      `[data-thumb-index="${activeImage}"]`,
    );
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeImage]);

  useEffect(() => {
    if (tabsPaused || typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || reduce.matches) return;

    const tick = () => {
      if (!desktop.matches) return;
      setActiveTab((current) => {
        const index = compositionTabs.findIndex((tab) => tab.id === current);
        const next =
          compositionTabs[(index < 0 ? 0 : index + 1) % Math.max(compositionTabs.length, 1)];
        return next?.id ?? current ?? "story";
      });
    };

    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [tabsPaused, slug, compositionTabs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, [slug]);

  const youMayAlsoLikeRail = useMerchRail(
    MERCH_RAIL_SLUGS.pdpAlsoLike,
    product?.id ? [product.id] : [],
  );

  const moreFromCollection = pickMoreFromCollection(apiProduct?.collections);
  const { data: moreFromFeed } = useQuery({
    queryKey: catalogKeys.collectionProducts(
      moreFromCollection?.slug ?? "",
      zoneCode,
      1,
      12,
      true,
    ),
    queryFn: () =>
      fetchCollectionProducts(moreFromCollection!.slug, zoneCode, {
        page: 1,
        limit: 12,
        onlySellable: true,
      }),
    enabled: Boolean(zoneCode && moreFromCollection?.slug),
    retry: false,
  });

  const related = useMemo(() => {
    if (!product) return [];
    const inCart = new Set(lines.map((l) => l.slug).filter(Boolean));
    return (moreFromFeed?.products ?? [])
      .filter((item) => item.id !== product.id && item.slug !== product.slug)
      .filter((item) => item.isSellable !== false)
      .filter((item) => !inCart.has(item.slug))
      .map((product) => toCatalogProduct(product))
      .slice(0, 4);
  }, [moreFromFeed, product, lines]);

  const youMayAlsoLike = useMemo(() => {
    const usedIds = new Set(related.map((item) => item.id));
    return youMayAlsoLikeRail.filter((item) => !usedIds.has(item.id)).slice(0, 4);
  }, [youMayAlsoLikeRail, related]);

  const moreFromHeading = moreFromCollection?.name.replace(/\.$/, "") ?? "";

  useEffect(() => {
    [...youMayAlsoLike, ...related].forEach((item) => {
      const hoverImg = item.imageUrls?.[1];
      if (hoverImg && hoverImg !== item.imageUrl) {
        const img = new Image();
        img.src = hoverImg;
        img.decode?.().catch(() => {});
      }
    });
  }, [youMayAlsoLike, related]);

  if ((!zoneCode || isPending) && !product) {
    return (
      <div className="landing">
        <section className="section container">
          <PageLoading label="Loading product…" />
        </section>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="landing">
        <section className="section container">
          <h1 className="display" style={{ fontSize: "2rem" }}>
            Product not found.
          </h1>
          <p className="lead" style={{ marginTop: "1rem" }}>
            <Link href="/products">Back to all products</Link>
          </p>
        </section>
      </div>
    );
  }

  const galleryImages = (product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : []
  )
    .filter(
      (src, index, arr): src is string =>
        Boolean(src) && arr.indexOf(src) === index,
    )
    .filter((src) => !failedImages.includes(src));
  const prVideo =
    apiProduct?.prVideo && !failedImages.includes(apiProduct.prVideo.url)
      ? apiProduct.prVideo
      : undefined;
  const heroSrc = galleryImages[activeImage] ?? galleryImages[0] ?? null;
  const family = familyChips(metafields);
  const chips = family.length
    ? family
    : (product.subtitle ?? "")
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
  const formatLabel =
    metafields?.size?.trim() ||
    `${product.concentration ? CONCENTRATION_LABELS[product.concentration] : "Fragrance"} · 50 ml`;
  const notesHeading = notesSectionTitle(metafields);
  const notesRows =
    livePyramid.length > 0
      ? livePyramid
      : authoredContent
        ? authoredContent.notes
        : [];
  const notesBlurb = metafields?.fragrance_notes?.trim();
  const showLongevityBars = livePyramid.length === 0 && notesRows.length > 0;
  const legacyRelated = (
    <>
      {youMayAlsoLike.length ? (
        <section className="pdp-related" aria-labelledby="also-like-heading">
          <div className="container container--full">
            <div className="pdp-related__head">
              <h2 className="pdp-related__title" id="also-like-heading">
                You may also <em className="pdp-related__em">like.</em>
              </h2>
              <Link className="pdp-related__all" href={`/collections/${MERCH_RAIL_SLUGS.pdpAlsoLike}`}>
                See all
              </Link>
            </div>
            <ul className="pdp-related__grid products-band" role="list">
              {youMayAlsoLike.map((item) => (
                <RelatedCard key={item.id} product={item} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      {related.length && moreFromCollection ? (
        <section className="pdp-related" aria-labelledby="related-heading">
          <div className="container container--full">
            <div className="pdp-related__head">
              <h2 className="pdp-related__title" id="related-heading">
                More from {moreFromHeading}.
              </h2>
              <Link className="pdp-related__all" href={`/collections/${moreFromCollection.slug}`}>
                See all
              </Link>
            </div>
            <ul className="pdp-related__grid products-band" role="list">
              {related.map((item) => (
                <RelatedCard key={item.id} product={item} collectionSlug={moreFromCollection.slug} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );

  return (
    <div className="landing pdp">
      <section
        className="pdp-hero"
        aria-labelledby="product-name"
        data-reveal={reveal ? "play" : undefined}
      >
        <div className="container container--full">
          <nav className="crumbs mb-[clamp(1rem,2vw,1.75rem)]" aria-label="Breadcrumb">
            <ol className="crumbs__list" role="list">
              <li>
                <Link href="/">Home</Link>
              </li>
              {moreFromCollection ? (
                <li>
                  <Link href={`/collections/${moreFromCollection.slug}`}>{moreFromCollection.name}</Link>
                </li>
              ) : null}
              {product.concentration ? (
                <li>{CONCENTRATION_LABELS[product.concentration]}</li>
              ) : null}
              <li aria-current="page">{product.title}</li>
            </ol>
          </nav>
          <div className="pdp-hero__split">
            <div className="pdp-hero__stage">
              {galleryImages.length > 1 ? (
                <div className="pdp-hero__thumbs-col">
                  <div
                    ref={thumbsRef}
                    className="pdp-hero__thumbs"
                    role="tablist"
                    aria-label="Product images"
                  >
                    {galleryImages.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        data-thumb-index={index}
                        className={`pdp-hero__thumb ${index === activeImage ? "is-active" : ""}`}
                        role="tab"
                        aria-selected={index === activeImage}
                        onClick={() => setActiveImage(index)}
                      >
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="pdp-hero__thumbs-next"
                    aria-label="Next product image"
                    onClick={() =>
                      setActiveImage((current) => (current + 1) % galleryImages.length)
                    }
                  >
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5 7.5 10 12.5 15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ) : null}

              <div className="pdp-hero__product">
                <div className="pdp-hero__glow" aria-hidden="true" />
                <div className="pdp-hero__frame">
                  {heroSrc ? (
                    <img
                      key={heroSrc}
                      className="pdp-hero__bottle"
                      src={heroSrc}
                      alt={product.title}
                      onError={() =>
                        setFailedImages((prev) =>
                          prev.includes(heroSrc) ? prev : [...prev, heroSrc],
                        )
                      }
                    />
                  ) : (
                    <span className="bottle" aria-hidden="true" />
                  )}
                </div>
                <div className="pdp-hero__floor" aria-hidden="true" />
                <div className="pdp-hero__mist" aria-hidden="true">
                  <span className="pdp-hero__puff pdp-hero__puff--a" />
                  <span className="pdp-hero__puff pdp-hero__puff--b" />
                  <span className="pdp-hero__puff pdp-hero__puff--c" />
                  <span className="pdp-hero__puff pdp-hero__puff--d" />
                  <span className="pdp-hero__puff pdp-hero__puff--e" />
                  <span className="pdp-hero__puff pdp-hero__puff--core" />
                  <span className="pdp-hero__puff pdp-hero__puff--veil" />
                </div>
              </div>
            </div>

            <div className="pdp-hero__panel">
              {apiProduct?.brandName || moreFromCollection ? (
                <p className="pdp-hero__eyebrow">
                  {[apiProduct?.brandName, moreFromCollection?.name].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <h1 className="pdp-hero__name" id="product-name">
                {product.title}
              </h1>
              <p className="pdp-hero__format">{formatLabel}</p>
              {showReviewRating && reviewSummary ? (
                <a className="pdp-hero__rating" href="#pdp-reviews">
                  <span className="stars" aria-hidden="true">
                    {reviewStarsLabel(reviewSummary.averageRating)}
                  </span>
                  <span>
                    <strong>{reviewSummary.averageRating.toFixed(1)}</strong>
                    {reviewSummary.verifiedPurchaseCount > 0
                      ? " · Verified reviews"
                      : ` · ${reviewSummary.reviewCount} ${reviewSummary.reviewCount === 1 ? "review" : "reviews"}`}
                  </span>
                </a>
              ) : null}
              {apiProduct?.description &&
              !apiProduct.description.startsWith("Product details will appear") ? (
                <p className="mt-[var(--sp-4)] max-w-[38rem] text-[0.9375rem] leading-normal text-[#6f6152]">{apiProduct.description}</p>
              ) : null}

              {chips.length ? (
                <ul className="pdp-hero__chips" role="list" aria-label="Featured notes">
                  {chips.map((chip) => (
                    <li className="pdp-hero__chip" key={chip}>
                      <span
                        className="pdp-hero__dot"
                        aria-hidden="true"
                        style={{ backgroundColor: noteDotColor(chip) }}
                      />
                      {chip}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-[var(--sp-6)] flex flex-wrap items-center gap-x-4 gap-y-3">
                <p className="m-0 text-[1.75rem] font-semibold tracking-[-0.01em] text-[#2a201a]">{formatMoney(product.price, product.currency)}</p>
                <OfferCountLink productId={product.id} />
              </div>
              {product.price != null ? (
                <p className="pdp-hero__installments">
                  or 4 interest-free payments of{" "}
                  <strong>{formatMoney(product.price / 4, product.currency)}</strong> with Tabby or
                  Tamara.
                </p>
              ) : null}

              {daysLine || thresholdLine ? (
                <ul className="pdp-hero__promises" role="list">
                  {daysLine ? (
                    <li className="pdp-hero__promise">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M2.5 13.5v-8h9v8zM11.5 8h3.2l2.8 3v2.5h-2" />
                        <circle cx="6" cy="14.8" r="1.7" />
                        <circle cx="14" cy="14.8" r="1.7" />
                      </svg>
                      <span>{daysLine}</span>
                    </li>
                  ) : null}
                  {thresholdLine ? (
                    <li className="pdp-hero__promise">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M10 2.8 3.5 5.5v4.2c0 4 2.8 6.6 6.5 7.5 3.7-.9 6.5-3.5 6.5-7.5V5.5z" />
                        <path d="M7.2 10l2 2 3.6-4" />
                      </svg>
                      <span>{thresholdLine}</span>
                    </li>
                  ) : null}
                </ul>
              ) : null}

              <div
                ref={buySlotRef}
                className="pdp-buy-slot"
                style={buyDocked && buyBarHeight ? { minHeight: buyBarHeight } : undefined}
              >
                <div
                  ref={buyBarRef}
                  className={`pdp-hero__buy${buyDocked ? " is-docked" : ""}`}
                >
                  <div className="pdp-qty">
                    <button
                      className="pdp-qty__btn"
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={displayQty <= 1}
                      onClick={() => {
                        if (cartLine) {
                          const next = Math.max(1, cartLine.quantity - 1);
                          if (cartLine.remote || cartLine.cartItemId) {
                            setQuantityOptimistic(cartLine.variantId, next);
                          } else {
                            updateLocalQuantity(cartLine.variantId, next);
                          }
                          return;
                        }
                        setQuantity((q) => Math.max(1, q - 1));
                      }}
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M4 10h12" />
                      </svg>
                    </button>
                    <span className="pdp-qty__value" aria-live="polite" aria-label="Quantity">
                      {displayQty}
                    </span>
                    <button
                      className="pdp-qty__btn"
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => {
                        if (cartLine) {
                          const next = Math.min(9, cartLine.quantity + 1);
                          if (cartLine.remote || cartLine.cartItemId) {
                            setQuantityOptimistic(cartLine.variantId, next);
                          } else {
                            updateLocalQuantity(cartLine.variantId, next);
                          }
                          return;
                        }
                        setQuantity((q) => Math.min(9, q + 1));
                      }}
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M10 4v12M4 10h12" />
                      </svg>
                    </button>
                  </div>

                  {product.isSellable === false ? (
                    <OutOfStockAlternatives productId={product.id} />
                  ) : (
                    <button
                      className="pdp-hero__add"
                      type="button"
                      onClick={() => {
                        // Instant: the bag updates and opens now; the API syncs behind.
                        void addToCart({
                          sku: product.sku,
                          variantId: product.variantId,
                          slug: product.slug,
                          title: product.title,
                          imageUrl: product.imageUrl,
                          price: product.price,
                          currency: product.currency,
                          quantity: cartLine ? 1 : quantity,
                        });
                        setStatus(`Added ${product.title} to your bag.`);
                      }}
                    >
                      {product.price != null
                        ? `Add to bag · ${formatMoney(product.price, product.currency)}`
                        : "Add to bag"}
                    </button>
                  )}

                  <button
                    className="pdp-hero__wish"
                    type="button"
                    aria-pressed={wished}
                    aria-label={`Add ${product.title} to wishlist`}
                    onClick={() => setWished((w) => !w)}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path d="M10 17s-6-4.35-6-8.5A3.5 3.5 0 0 1 10 6a3.5 3.5 0 0 1 6 2.5c0 4.15-6 8.5-6 8.5z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="pdp-hero__status" role="status">
                {status}
              </p>
              <PdpOffersPanel productId={product.id} />
              <PdpScentFamily
                current={product}
                familyCode={family[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "") || null}
                zoneCode={zoneCode}
                fallback={related}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pdp-composition" aria-labelledby="composition-heading">
        <div className="container container--full">
          <p className="pdp-composition__eyebrow">The composition</p>
          <h2 className="pdp-composition__title" id="composition-heading">
            How it is <em className="pdp-composition__em">built.</em>
          </h2>

          <div className="pdp-comp-tabs" role="tablist" aria-label="Composition details">
            {compositionTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`pdp-comp-tabs__tab ${activeTab === tab.id ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => {
                  setTabsPaused(true);
                  setActiveTab(tab.id);
                }}
              >
                {tab.id === "notes" ? notesHeading : tab.label}
              </button>
            ))}
          </div>

          <div className="pdp-comp-panels">
            {compositionTabs.map((tab) => (
              <CompItem
                key={tab.id}
                label={tab.id === "notes" ? notesHeading : tab.label}
                open={activeTab === tab.id}
                onToggle={() => {
                  setTabsPaused(true);
                  setActiveTab((current) => (current === tab.id ? current : tab.id));
                }}
              >
                {tab.id === "story" ? <p className="pdp-composition__intro">{content.story}</p> : null}
                {tab.id === "notes" ? (
                  <>
                    <ul className="pdp-notes" role="list">
                      {notesRows.map((row) => (
                        <li className="pdp-notes__row" key={row.level}>
                          <p className="pdp-notes__level">{row.level}</p>
                          <p className="pdp-notes__names">{row.names}</p>
                          {showLongevityBars && "bar" in row ? (
                            <div
                              className="pdp-notes__bar"
                              aria-hidden="true"
                              style={{ "--bar": `${row.bar}%` } as CSSProperties}
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {notesBlurb ? (
                      <p className="pdp-composition__intro">{notesBlurb}</p>
                    ) : null}
                    {showLongevityBars ? (
                      <p className="pdp-notes__key">
                        Bar length — how long each layer stays on skin.
                      </p>
                    ) : null}
                  </>
                ) : null}
                {tab.id === "details" ? (
                  <dl className="pdp-specs">
                    {metafields?.fragrance_family_text?.trim() ? (
                      <div className="pdp-specs__row">
                        <dt>Family</dt>
                        <dd>{metafields.fragrance_family_text.trim()}</dd>
                      </div>
                    ) : null}
                    <div className="pdp-specs__row">
                      <dt>Perfumer</dt>
                      <dd>Not published</dd>
                    </div>
                    <div className="pdp-specs__row">
                      <dt>Format</dt>
                      <dd>{formatLabel}</dd>
                    </div>
                    <div className="pdp-specs__row">
                      <dt>Collection</dt>
                      <dd>{COLLECTION_LABELS[product.collection] ?? "Signature"}</dd>
                    </div>
                    <div className="pdp-specs__row">
                      <dt>Origin</dt>
                      <dd>United Arab Emirates</dd>
                    </div>
                  </dl>
                ) : null}
                {tab.id === "wear" ? <p>{content.wear}</p> : null}
                {tab.id === "ship" && content.shipping ? <p>{content.shipping}</p> : null}
                {tab.id === "auth" ? <p>{content.authenticity}</p> : null}
              </CompItem>
            ))}
          </div>

          <p className="pdp-code">Product code: {productCode(product)}</p>
        </div>
      </section>

      <PdpReviews
        productId={apiProduct?.id ?? product.id}
        productTitle={product.title}
        variantId={product.variantId}
        reviews={pdpReviews}
      />

      {apiProduct?.id ? (
        <ProductCompanions
          productId={apiProduct.id}
          marketCode={zoneCode}
          omitGroupIds={youMayAlsoLike.length > 0 ? ["also"] : []}
          fallback={null}
        />
      ) : null}
      {legacyRelated}
      <RecentlyViewed excludeProductId={apiProduct?.id ?? product.id} />

      {prVideo && prVideoOpen ? (
        <div
          className={`pdp-float-video ${prVideoExpanded ? "is-expanded" : ""}`}
        >
          <video
            src={prVideo.url}
            poster={galleryImages[0] ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            aria-label={prVideo.name ?? `${product.title} video`}
            onError={() =>
              setFailedImages((prev) =>
                prev.includes(prVideo.url) ? prev : [...prev, prVideo.url],
              )
            }
          />
          <button
            type="button"
            className="pdp-float-video__close"
            aria-label="Close video"
            onClick={() => setPrVideoOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="pdp-float-video__expand"
            aria-label={prVideoExpanded ? "Shrink video" : "Expand video"}
            onClick={() => setPrVideoExpanded((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}

    </div>
  );
}

function CompItem({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pdp-comp-item">
      <h3 className="pdp-comp-acc__heading">
        <button type="button" className="pdp-comp-acc__btn" aria-expanded={open} onClick={onToggle}>
          {label} <span className="pdp-comp-acc__mark" aria-hidden="true" />
        </button>
      </h3>
      <div className="pdp-comp-panel" role="tabpanel" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

function RelatedCard({
  product,
  collectionSlug,
}: {
  product: CatalogProduct;
  collectionSlug?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !imageFailed;

  const hoverCandidate = product.imageUrls?.[1];
  const hover = hoverCandidate && hoverCandidate !== product.imageUrl ? hoverCandidate : null;
  const loadedImages = useLoadedImages([hover]);
  const hasIngredientsHover = !imageFailed && Boolean(hover && loadedImages.has(hover));

  return (
    <li
      className="product-card"
      style={
        hasIngredientsHover
          ? ({ "--ingredients-bg": `url(${hover})` } as CSSProperties)
          : undefined
      }
    >
      <Link className="product-card__link" href={`/products/${product.slug}`} aria-label={product.title} />
      <ProductCardTags
        slug={product.slug}
        tags={product.tags ?? []}
        collectionSlug={collectionSlug}
      />
      <div
        className={
          hasIngredientsHover ? "product-card__media product-card__media--swap" : "product-card__media"
        }
      >
        <Link
          className="product-card__media-link"
          href={`/products/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          {showImage ? (
            <img
              src={product.imageUrl as string}
              alt={product.title}
              width={600}
              height={600}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="bottle" aria-hidden="true" />
          )}
        </Link>
      </div>
      <div className="product-card__add-slot">
        <AddToBagButton product={product} variant="product" />
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatMoney(product.price, product.currency)}</p>
      </div>
    </li>
  );
}
