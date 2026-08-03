"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApiQuery } from "@/lib/api/queryHooks";
import { PageLoading } from "@/components/ui";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { toast } from "@/components/ui/Toaster";
import { ProductCard } from "@/features/home/components/ProductCard";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { catalogKeys, fetchProductBySlug } from "../api/catalog.service";
import {
  PDP_SHOWCASE,
  getPdpRecommendations,
  pdpAssets,
} from "../data/pdpContent";

function formatDisplayPrice(
  currency: string,
  price: number | null,
  fallbackUsd: number,
) {
  if (price == null) {
    return `$${fallbackUsd.toFixed(2)}`;
  }
  if (currency === "USD" || currency === "$") {
    return `$${price.toFixed(2)}`;
  }
  return `${currency} ${price.toFixed(2)}`;
}

export function ProductDetailPageView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const addToCart = useAddToCart();
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);

  const isShowcaseSlug = slug === "shaghaf-vanilla-toffee";

  const { data, isLoading } = useApiQuery(
    catalogKeys.detail(slug, zoneCode),
    () => fetchProductBySlug(slug, zoneCode),
    {
      // Figma showcase can render without waiting on catalog API
      enabled: !isShowcaseSlug,
    },
  );

  const isShowcase =
    isShowcaseSlug ||
    Boolean(data?.title?.toLowerCase().includes("vanilla toffee"));

  const gallery = useMemo(() => {
    if (isShowcase) return [...pdpAssets.gallery];
    if (data?.imageUrl) return [data.imageUrl];
    return [...pdpAssets.gallery];
  }, [data?.imageUrl, isShowcase]);

  if (isLoading && !isShowcase) return <PageLoading />;
  if (!isShowcase && !isLoading && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold text-sa-primary">Product not found</h1>
      </div>
    );
  }

  const title = isShowcase
    ? PDP_SHOWCASE.title
    : (data?.title ?? PDP_SHOWCASE.title);
  const collection = isShowcase
    ? PDP_SHOWCASE.collection
    : data?.subtitle
      ? `Swiss Arabian · ${data.subtitle}`
      : PDP_SHOWCASE.collection;
  const priceValue = isShowcase
    ? PDP_SHOWCASE.price
    : (data?.price ?? PDP_SHOWCASE.price);
  const currency = isShowcase ? "USD" : (data?.currency ?? "USD");
  const description = isShowcase
    ? PDP_SHOWCASE.description
    : (data?.description ?? PDP_SHOWCASE.description);
  const notes = isShowcase
    ? [...PDP_SHOWCASE.notes]
    : data?.subtitle
      ? data.subtitle.split(/[·,]/).map((n) => n.trim()).filter(Boolean)
      : [...PDP_SHOWCASE.notes];

  const breadcrumbs = isShowcase
    ? PDP_SHOWCASE.breadcrumbs
    : [
        { label: "Home", href: "/" },
        { label: "Perfumes", href: "/products" },
        { label: title, href: `/products/${slug}` },
      ];

  const canAdd = isShowcase
    ? true
    : Boolean(data?.isSellable && data.price != null);
  const unitPrice = isShowcase
    ? PDP_SHOWCASE.price
    : (data?.price ?? PDP_SHOWCASE.price);

  const mainSrc = gallery[activeImage] ?? gallery[0];
  const recommendations = getPdpRecommendations(slug);

  return (
    <div className="bg-page text-sa-primary">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-4 py-3 text-[12px] sm:px-6 lg:px-10 xl:px-20"
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-sa-muted" aria-hidden>
                  /
                </span>
              ) : null}
              {isLast ? (
                <span className="font-semibold tracking-wide text-sa-primary">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="font-semibold tracking-wide text-sa-muted hover:text-sa-primary"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Main showcase */}
      <section className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-16 pt-2 sm:px-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-16 lg:px-10 xl:gap-20 xl:px-20">
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative flex aspect-square items-center justify-center border border-sa-border bg-gradient-to-b from-page to-cream p-6 dark:to-section-soft sm:p-8">
            {isShowcase ? (
              <span className="absolute left-[23px] top-[23px] bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                {PDP_SHOWCASE.badge}
              </span>
            ) : null}
            <div className="relative h-[70%] w-[75%] max-w-[400px]">
              <Image
                src={mainSrc}
                alt={title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 90vw, 400px"
                unoptimized={mainSrc.endsWith(".svg")}
              />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto sm:gap-4">
            {gallery.map((src, index) => {
              const active = index === activeImage;
              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={active}
                  className={`relative size-[72px] shrink-0 border bg-cream p-2 dark:bg-section-soft sm:size-[96px] lg:size-[128px] ${
                    active
                      ? "border-[1.5px] border-terra"
                      : "border-sa-border"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="128px"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-8 lg:max-w-[600px]">
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-sa-muted">
              {collection}
            </p>
            <h1 className="font-sans text-[32px] font-medium leading-tight tracking-[-0.02em] text-sa-primary sm:text-[42px] sm:leading-[48px]">
              {title}
            </h1>
            <p className="text-base font-bold text-sa-primary">
              {formatDisplayPrice(currency, priceValue, PDP_SHOWCASE.price)}
            </p>
            {!isShowcase && data && !data.isSellable ? (
              <p className="text-[13px] text-sa-muted">
                {data.blockReasons?.[0] ?? "Availability pending refresh"}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gold">
              Fragrance family &amp; key notes
            </p>
            <div className="flex flex-wrap gap-2">
              {notes.map((note, index) => (
                <span
                  key={note}
                  className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] ${
                    index === 0
                      ? "bg-terra text-white"
                      : "border border-sa-input text-sa-muted"
                  }`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[14px] leading-relaxed text-sa-primary opacity-90">
            {description}
          </p>

          <div className="h-px w-full bg-sa-border" aria-hidden />

          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-sa-muted">
              Size:{" "}
              <span className="font-bold text-sa-primary">
                {PDP_SHOWCASE.sizeLabel}
              </span>
            </p>
            <button
              type="button"
              className="w-fit border-[1.5px] border-terra bg-surface px-6 py-3 text-[12px] font-semibold text-sa-primary"
            >
              {PDP_SHOWCASE.sizeOption}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-[42px] items-center gap-5 border border-sa-input bg-cream px-4 dark:bg-section-soft">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="text-base font-semibold text-sa-muted hover:text-sa-primary"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-bold">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="text-base font-semibold text-sa-muted hover:text-sa-primary"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={!canAdd && !isShowcase}
              className="flex h-[42px] flex-1 items-center justify-center bg-terra px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-[200px]"
              onClick={() => {
                if (!canAdd && !isShowcase) {
                  toast(
                    "This product isn’t available to purchase yet.",
                    "error",
                  );
                  return;
                }
                addToCart({
                  productId: data?.id ?? "shaghaf-vanilla-toffee",
                  variantId: data?.variantId ?? "shaghaf-vanilla-toffee",
                  slug: slug || "shaghaf-vanilla-toffee",
                  title,
                  imageUrl: mainSrc,
                  unitPrice,
                  currency: currency === "USD" ? "USD" : currency,
                  notes: notes.slice(0, 5),
                  sizeLabel: "75 ml EDP",
                  quantity: qty,
                });
                toast("Added to bag", "success");
              }}
            >
              {canAdd || isShowcase ? "Add to bag" : "Unavailable"}
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {PDP_SHOWCASE.trust.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <Image
                  src={item.icon}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4"
                  unoptimized
                />
                <span className="text-[12px] text-sa-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* You May Also Like — same ProductCard as landing */}
      <section
        className="bg-page py-16 lg:py-[88px]"
        aria-label="You may also like"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center border-b border-sa-border pb-3.5 text-center">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-gold">
              Complete your collection
            </p>
            <h2 className="mt-3 font-sans text-[32px] font-medium tracking-[-0.02em] text-sa-primary sm:text-[44px] sm:leading-[52px]">
              You May Also Like
            </h2>
          </div>

          <div className="-mx-4 mt-10 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
