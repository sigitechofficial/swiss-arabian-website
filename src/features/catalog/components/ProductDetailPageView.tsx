"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApiQuery } from "@/lib/api/queryHooks";
import { PageLoading } from "@/components/ui";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { toast } from "@/components/ui/Toaster";
import { ProductCard } from "@/features/home/components/ProductCard";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { formatMoney } from "@/features/home/data/homeContent";
import { insiderProductViewed } from "@/lib/insider";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchProductBySlug,
  fetchProducts,
} from "../api/catalog.service";
import { PDP_TRUST } from "../data/pdpContent";
import { notesFromCatalogHtml } from "../utils/catalogHtml";
import { toProductCardModel } from "../utils/toProductCardModel";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import {
  ProductRatingBadge,
  ProductReviewsSection,
} from "@/features/reviews";
import { ProductImageZoom } from "./ProductImageZoom";

export function ProductDetailPageView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const addToCart = useAddToCart();
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);

  const { data, isLoading, isError } = useApiQuery(
    catalogKeys.detail(slug, zoneCode),
    () => fetchProductBySlug(slug, zoneCode),
    { enabled: Boolean(slug) },
  );

  const { data: relatedData } = useApiQuery(
    catalogKeys.list(zoneCode, 1, CATALOG_PAGE_SIZE),
    () => fetchProducts(zoneCode, { page: 1, limit: CATALOG_PAGE_SIZE }),
    { enabled: Boolean(data) },
  );

  const gallery = useMemo(() => {
    if (!data) return [] as string[];
    if (data.imageUrls?.length) return data.imageUrls;
    if (data.imageUrl) return [data.imageUrl];
    return [];
  }, [data]);

  useEffect(() => {
    setActiveImage(0);
    setQty(1);
  }, [slug]);

  useEffect(() => {
    if (activeImage >= gallery.length) setActiveImage(0);
  }, [gallery.length, activeImage]);

  useEffect(() => {
    if (!data) return;
    const category =
      data.collections?.find((c) => c.isFeatured)?.name ||
      data.collections?.[0]?.name ||
      null;
    insiderProductViewed({
      id: data.variantId || data.id,
      sku: data.sku || data.variantId || data.id,
      name: data.title,
      price: data.price ?? 0,
      currency: data.currency || "AED",
      imageUrl: data.imageUrl ?? data.imageUrls?.[0] ?? null,
      category,
      brand: data.brandName ?? null,
    });
  }, [data]);

  const recommendations = useMemo(() => {
    const items = relatedData?.products ?? [];
    return items
      .filter((p) => p.slug !== slug && p.id !== data?.id)
      .slice(0, 4);
  }, [relatedData?.products, slug, data?.id]);

  if (isLoading) {
    return <PageLoading label="Loading product…" fill />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <h1 className="font-sans text-[28px] font-medium text-sa-primary">
          Product not found
        </h1>
        <p className="max-w-sm text-[14px] text-sa-muted">
          This fragrance isn’t available in the catalog for your market.
        </p>
        <Link
          href="/products"
          className="mt-2 inline-flex h-[42px] cursor-pointer items-center justify-center bg-terra px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#a25e48]"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const title = data.title;
  const brandLine =
    data.brandName?.trim() ||
    data.collections?.find((c) => c.isFeatured)?.name ||
    data.collections?.[0]?.name ||
    data.sku ||
    "Swiss Arabian";
  const currency = data.currency || "AED";
  const priceValue = data.price;
  const descriptionHtml = data.descriptionHtml?.trim();
  const descriptionPlain =
    data.description?.trim() ||
    "Product details will appear once the catalog is fully refreshed.";
  const notes = notesFromCatalogHtml(
    descriptionHtml || data.description,
  );
  const canAdd = Boolean(data.isSellable && data.price != null);
  const mainSrc = gallery[activeImage] ?? gallery[0] ?? null;
  const collectionLinks = (data.collections ?? []).filter(
    (c) => c.slug && !c.slug.includes("not-for-sale"),
  );

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: title, href: `/products/${slug}` },
  ];

  return (
    <div className="flex flex-1 flex-col bg-page text-sa-primary">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-2 px-4 py-3 text-[12px] sm:px-6 lg:px-10 xl:px-20"
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.href}-${index}`} className="flex items-center gap-2">
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

      <section className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 pb-16 pt-2 sm:px-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-16 lg:px-10 xl:gap-20 xl:px-20">
        <div className="flex flex-col gap-4">
          <ProductImageZoom
            images={gallery}
            activeIndex={activeImage}
            alt={title}
          />

          {gallery.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto sm:gap-4">
              {gallery.map((src, index) => {
                const active = index === activeImage;
                return (
                  <button
                    key={`thumb-${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={active}
                    className={`relative size-[72px] shrink-0 cursor-pointer overflow-hidden border bg-page sm:size-[96px] lg:size-[128px] ${
                      active
                        ? "border-[1.5px] border-terra"
                        : "border-sa-border"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-8 lg:max-w-[600px]">
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-sa-muted">
              {brandLine}
            </p>
            <h1 className="font-sans text-[32px] font-medium leading-tight tracking-[-0.02em] text-sa-primary sm:text-[42px] sm:leading-[48px]">
              {title}
            </h1>
            <ProductRatingBadge productKey={data.id} />
            <p
              className={`text-base font-bold ${
                priceValue == null ? "text-sa-muted" : "text-sa-primary"
              }`}
            >
              {priceValue == null
                ? "Price unavailable"
                : formatMoney(priceValue, currency)}
            </p>
            {!data.isSellable ? (
              <p className="text-[13px] text-sa-muted">
                {data.blockReasons?.[0] ?? "Availability pending refresh"}
              </p>
            ) : null}
          </div>

          {notes.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gold">
                In this set
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
          ) : null}

          {descriptionHtml ? (
            <div
              className="space-y-3 text-[14px] leading-relaxed text-sa-primary opacity-90 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-sa-primary opacity-90">
              {descriptionPlain}
            </p>
          )}

          {collectionLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sa-muted">
                Collections
              </span>
              {collectionLinks.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="border border-sa-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sa-primary transition-colors hover:border-terra hover:text-terra"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : null}

          {data.sku ? (
            <>
              <div className="h-px w-full bg-sa-border" aria-hidden />
              <p className="text-[11px] font-semibold tracking-[0.14em] text-sa-muted">
                SKU:{" "}
                <span className="font-bold text-sa-primary">{data.sku}</span>
              </p>
            </>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-[42px] items-center gap-5 border border-sa-input bg-cream px-4 dark:bg-section-soft">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="cursor-pointer text-base font-semibold text-sa-muted hover:text-sa-primary"
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
                className="cursor-pointer text-base font-semibold text-sa-muted hover:text-sa-primary"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <WishlistHeartButton productId={data.id} size="pdp" />
            <button
              type="button"
              disabled={!canAdd}
              className="flex h-[42px] flex-1 cursor-pointer items-center justify-center bg-terra px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-[200px]"
              onClick={() => {
                if (!canAdd || data.price == null) {
                  toast(
                    "This product isn’t available to purchase yet.",
                    "error",
                  );
                  return;
                }
                addToCart({
                  productId: data.id,
                  variantId: data.variantId,
                  slug: data.slug,
                  title: data.title,
                  imageUrl: mainSrc ?? undefined,
                  unitPrice: data.price,
                  currency,
                  notes: notes.slice(0, 5),
                  quantity: qty,
                  sku: data.sku,
                  category:
                    data.collections?.find((c) => c.isFeatured)?.name ||
                    data.collections?.[0]?.name ||
                    null,
                  brand: data.brandName ?? null,
                });
              }}
            >
              {canAdd ? "Add to bag" : "Unavailable"}
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {PDP_TRUST.map((item) => (
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

      <ProductReviewsSection
        key={data.id}
        productId={data.id}
        variantId={data.variantId}
      />

      {recommendations.length > 0 ? (
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
                <ProductCard
                  key={product.id}
                  product={toProductCardModel(product)}
                  addDisabled={
                    product.price == null || product.isSellable === false
                  }
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <NewsletterSection />
    </div>
  );
}
