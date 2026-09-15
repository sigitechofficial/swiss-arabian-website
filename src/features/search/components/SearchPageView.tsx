"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { ProductCardTags } from "@/features/catalog/components/ProductCardTags";
import { CatalogPagination } from "@/features/catalog/components/CatalogPagination";
import { useLoadedImages } from "@/features/catalog/hooks/useLoadedImages";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import type { ProductSummary } from "@/features/catalog/types/product";
import type { CatalogSearchSort } from "@/features/catalog/api/catalog.service";
import { SEARCH_MIN_QUERY_LENGTH, SEARCH_SORT_OPTIONS } from "../constants";
import { useCatalogSearch } from "../hooks/useCatalogSearch";

function searchHref(input: {
  q: string;
  page?: number;
  sort?: CatalogSearchSort;
}): string {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.sort && input.sort !== "newest") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function SearchPageView({
  query,
  page = 1,
  sort = "newest",
}: {
  query: string;
  page?: number;
  sort?: CatalogSearchSort;
}) {
  const router = useRouter();
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const { products, total, totalPages, tooShort, isLoading, isError, refetch } =
    useCatalogSearch(trimmed, { page, sort });

  const subtitle = () => {
    if (!hasQuery) return "Type a product name, note, or SKU to search the catalog.";
    if (tooShort)
      return `Type at least ${SEARCH_MIN_QUERY_LENGTH} characters to search.`;
    if (isLoading) return "Searching the catalog…";
    if (isError) return "We couldn’t reach the catalog. Please try again.";
    if (!products.length)
      return "No products matched that search. Try a note, a shorter spelling, or browse the collection.";
    return `${total} ${total === 1 ? "match" : "matches"} — names, brands, and SKUs.`;
  };

  return (
    <div className="landing">
      <section className="collection-head" aria-labelledby="search-heading">
        <div className="container container--full">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol className="crumbs__list" role="list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">Search</li>
            </ol>
          </nav>

          <header className="search-page-head">
            <p className="collection-head__eyebrow">Catalog search</p>
            <h1 className="collection-head__title" id="search-heading">
              {hasQuery ? (
                <>
                  Results for <em className="collection-head__em">“{trimmed}”</em>
                </>
              ) : (
                <>
                  Search the <em className="collection-head__em">collection.</em>
                </>
              )}
            </h1>
            <p className="collection-head__intro" aria-live="polite">
              {subtitle()}
            </p>
          </header>
        </div>
      </section>

      {/* `products-band` is what scopes the `.product-grid` columns in
          v5-catalog.css — without it the results stack full-width. */}
      <section className="grid-band products-band search-page-grid">
        <div className="container container--full">
          {hasQuery && !tooShort && products.length ? (
            <div className="catalog__toolbar" style={{ marginBottom: "1.25rem" }}>
              <label className="catalog__sort">
                <span className="catalog__sort-label">Sort</span>
                <select
                  className="catalog__sort-select"
                  value={sort}
                  onChange={(event) => {
                    router.push(
                      searchHref({
                        q: trimmed,
                        page: 1,
                        sort: event.target.value as CatalogSearchSort,
                      }),
                    );
                  }}
                >
                  {SEARCH_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {products.length ? (
            <WishlistStatusScope>
              <ul className="product-grid" role="list">
                {products.map((product) => (
                  <SearchProductCard key={product.id} product={product} />
                ))}
              </ul>
            </WishlistStatusScope>
          ) : isError ? (
            <p className="grid-band__empty">
              <button type="button" onClick={refetch}>
                Try again
              </button>
            </p>
          ) : hasQuery && !isLoading ? (
            <p className="grid-band__empty">
              <Link href="/products">Explore the collection</Link>
            </p>
          ) : !hasQuery ? (
            <p className="grid-band__empty">
              Use the search icon in the header to find a scent by name.
            </p>
          ) : null}
          {hasQuery && !tooShort && totalPages > 1 ? (
            <CatalogPagination
              page={page}
              totalPages={totalPages}
              total={total}
              hrefForPage={(nextPage) =>
                searchHref({ q: trimmed, page: nextPage, sort })
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SearchProductCard({ product }: { product: ProductSummary }) {
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
      <ProductCardTags slug={product.slug} tags={product.tags ?? []} />
      <div className="product-card__action">
        <WishlistHeartButton productId={product.id} />
      </div>
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
            // eslint-disable-next-line @next/next/no-img-element
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
        <p className="product-card__eyebrow">{cardEyebrow(product.subtitle)}</p>
        <h3 className="product-card__name">{product.title}</h3>
        <p className="product-card__price">{formatMoney(product.price, product.currency)}</p>
      </div>
    </li>
  );
}
