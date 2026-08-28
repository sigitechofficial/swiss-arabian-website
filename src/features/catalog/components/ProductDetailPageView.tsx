"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useAddToCart } from "@/features/cart";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import {
  CATALOG_PRODUCTS,
  COLLECTION_LABELS,
  CONCENTRATION_LABELS,
  type CatalogProduct,
} from "../constants/catalogProducts";
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
  shipping:
    "Standard delivery in 3–7 working days across the UAE and GCC; free on orders over AED 150.00. Unopened items can be returned free within 30 days of delivery.",
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
  const base = product.title.replace(/\s+/g, "").toUpperCase();
  const size = product.concentration === "extrait" ? "EXT50" : "EDP100";
  return `SA-${base}-${size}`;
}

export function ProductDetailPageView({ slug }: { slug: string }) {
  const product = useMemo(
    () => CATALOG_PRODUCTS.find((p) => p.slug === slug),
    [slug],
  );
  const content = (slug && PRODUCT_DETAIL_CONTENT[slug]) || FALLBACK_CONTENT;

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId | null>("notes");
  const [quantity, setQuantity] = useState(1);
  const [wished, setWished] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState("");
  const [buyDocked, setBuyDocked] = useState(false);
  const [buyBarHeight, setBuyBarHeight] = useState<number | null>(null);
  const buySlotRef = useRef<HTMLDivElement>(null);
  const buyBarRef = useRef<HTMLDivElement>(null);

  const { addToCart, isPending } = useAddToCart();

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
    setActiveTab(isMobile ? null : "notes");
  }, [slug]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setWished(false);
    setStatus("");
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, [slug]);

  const otherProducts = useMemo(() => {
    if (!product) return [];
    return CATALOG_PRODUCTS.filter((p) => p.slug !== product.slug);
  }, [product]);

  // "More from the 01 collection." — same collection line as the product
  // being viewed, prioritised first.
  const related = useMemo(() => {
    if (!product) return [];
    return otherProducts
      .slice()
      .sort(
        (a, b) =>
          (a.collection === product.collection ? -1 : 0) -
          (b.collection === product.collection ? -1 : 0),
      )
      .slice(0, 4);
  }, [otherProducts, product]);

  // "You may also like." — a separate, broader pick (kept out of the
  // collection strip above so the two rows don't repeat the same bottles).
  const youMayAlsoLike = useMemo(() => {
    const usedIds = new Set(related.map((item) => item.id));
    return otherProducts.filter((item) => !usedIds.has(item.id)).slice(0, 4);
  }, [otherProducts, related]);

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

  const gallery = [product.imageUrl, product.imageUrls?.[1]].filter(
    (src, index, arr): src is string => Boolean(src) && arr.indexOf(src) === index,
  );
  const chips = (product.subtitle ?? "").split("·").map((s) => s.trim()).filter(Boolean).slice(0, 3);

  return (
    <div className="landing pdp">
      <section
        className="pdp-hero"
        aria-labelledby="product-name"
        data-reveal={reveal ? "play" : undefined}
      >
        <div className="container container--full">
          <div className="pdp-hero__split">
            <div className="pdp-hero__stage">
              <div className="pdp-hero__product">
                <div className="pdp-hero__glow" aria-hidden="true" />
                <div className="pdp-hero__frame">
                  <img
                    key={gallery[activeImage]}
                    className="pdp-hero__bottle"
                    src={gallery[activeImage] ?? product.imageUrl ?? undefined}
                    alt={product.title}
                  />
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

              {gallery.length > 1 ? (
                <div className="pdp-hero__thumbs" role="tablist" aria-label="Product images">
                  {gallery.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      className={`pdp-hero__thumb ${index === activeImage ? "is-active" : ""}`}
                      role="tab"
                      aria-selected={index === activeImage}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="pdp-hero__panel">
              <p className="pdp-hero__eyebrow">{cardEyebrow(product.subtitle)}</p>
              <h1 className="pdp-hero__name" id="product-name">
                {product.title}
              </h1>
              <p className="pdp-hero__format">
                {CONCENTRATION_LABELS[product.concentration]} · 50&nbsp;ml
              </p>

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

              <p className="pdp-hero__price">{formatMoney(product.price, product.currency)}</p>
              {product.price != null ? (
                <p className="pdp-hero__installments">
                  or 4 interest-free payments of{" "}
                  <strong>{formatMoney(product.price / 4, product.currency)}</strong> with Tabby or
                  Tamara.
                </p>
              ) : null}

              <ul className="pdp-hero__promises" role="list">
                <li className="pdp-hero__promise">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M2.5 13.5v-8h9v8zM11.5 8h3.2l2.8 3v2.5h-2" />
                    <circle cx="6" cy="14.8" r="1.7" />
                    <circle cx="14" cy="14.8" r="1.7" />
                  </svg>
                  <span>
                    Order today — <strong>delivered in 3–7 working days</strong>.
                  </span>
                </li>
                <li className="pdp-hero__promise">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M10 2.8 3.5 5.5v4.2c0 4 2.8 6.6 6.5 7.5 3.7-.9 6.5-3.5 6.5-7.5V5.5z" />
                    <path d="M7.2 10l2 2 3.6-4" />
                  </svg>
                  <span>Free shipping over AED 150.00 · free returns within 30 days.</span>
                </li>
              </ul>

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
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M4 10h12" />
                      </svg>
                    </button>
                    <span className="pdp-qty__value" aria-live="polite" aria-label="Quantity">
                      {quantity}
                    </span>
                    <button
                      className="pdp-qty__btn"
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => Math.min(9, q + 1))}
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M10 4v12M4 10h12" />
                      </svg>
                    </button>
                  </div>

                  <button
                    className="pdp-hero__add"
                    type="button"
                    disabled={isPending}
                    onClick={async () => {
                      await addToCart({
                        sku: product.sku,
                        variantId: product.variantId,
                        slug: product.slug,
                        title: product.title,
                        imageUrl: product.imageUrl,
                        price: product.price,
                        currency: product.currency,
                        quantity,
                      });
                      setStatus(`Added ${product.title} to your bag.`);
                    }}
                  >
                    {isPending ? "Adding…" : "Add to bag"}
                  </button>

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
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`pdp-comp-tabs__tab ${activeTab === tab.id ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pdp-comp-panels">
            {TABS.map((tab) => (
              <CompItem
                key={tab.id}
                label={tab.label}
                open={activeTab === tab.id}
                onToggle={() => setActiveTab((current) => (current === tab.id ? current : tab.id))}
              >
                {tab.id === "story" ? <p className="pdp-composition__intro">{content.story}</p> : null}
                {tab.id === "notes" ? (
                  <>
                    <ul className="pdp-notes" role="list">
                      {content.notes.map((row) => (
                        <li className="pdp-notes__row" key={row.level}>
                          <p className="pdp-notes__level">{row.level}</p>
                          <p className="pdp-notes__names">{row.names}</p>
                          <div
                            className="pdp-notes__bar"
                            aria-hidden="true"
                            style={{ "--bar": `${row.bar}%` } as CSSProperties}
                          />
                        </li>
                      ))}
                    </ul>
                    <p className="pdp-notes__key">Bar length — how long each layer stays on skin.</p>
                  </>
                ) : null}
                {tab.id === "details" ? (
                  <dl className="pdp-specs">
                    <div className="pdp-specs__row">
                      <dt>Perfumer</dt>
                      <dd>Not published</dd>
                    </div>
                    <div className="pdp-specs__row">
                      <dt>Format</dt>
                      <dd>{CONCENTRATION_LABELS[product.concentration]} · 50&nbsp;ml</dd>
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
                {tab.id === "ship" ? <p>{content.shipping}</p> : null}
                {tab.id === "auth" ? <p>{content.authenticity}</p> : null}
              </CompItem>
            ))}
          </div>

          <p className="pdp-code">Product code: {productCode(product)}</p>
        </div>
      </section>

      {youMayAlsoLike.length ? (
        <section className="pdp-related" aria-labelledby="also-like-heading">
          <div className="container container--full">
            <div className="pdp-related__head">
              <h2 className="pdp-related__title" id="also-like-heading">
                You may also <em className="pdp-related__em">like.</em>
              </h2>
              <Link className="pdp-related__all" href="/products">
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

      {related.length ? (
        <section className="pdp-related" aria-labelledby="related-heading">
          <div className="container container--full">
            <div className="pdp-related__head">
              <h2 className="pdp-related__title" id="related-heading">
                More from the 01 collection.
              </h2>
              <Link className="pdp-related__all" href="/products">
                See all
              </Link>
            </div>

            <ul className="pdp-related__grid products-band" role="list">
              {related.map((item) => (
                <RelatedCard key={item.id} product={item} />
              ))}
            </ul>
          </div>
        </section>
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

function RelatedCard({ product }: { product: CatalogProduct }) {
  const hover = product.imageUrls?.[1] ?? product.imageUrl;
  const hasIngredientsHover = Boolean(hover && hover !== product.imageUrl);

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
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} width={600} height={600} loading="lazy" />
          ) : (
            <span className="bottle" aria-hidden="true" />
          )}
        </Link>
      </div>
      <div className="product-card__add-slot">
        <AddToBagButton product={product} variant="product" />
      </div>
      <div className="product-card__body">
        <p className="product-card__eyebrow">{cardEyebrow(product.subtitle)}</p>
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatMoney(product.price, product.currency)}</p>
      </div>
    </li>
  );
}
