import Link from "next/link";
import type { CSSProperties } from "react";
import { AddToBagButton } from "@/features/home/components/landing/AddToBagButton";
import { cardEyebrow, formatMoney } from "@/features/home/utils/formatMoney";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { searchCatalog } from "../lib/searchCatalog";

export function SearchPageView({ query }: { query: string }) {
  const hits = query.trim() ? searchCatalog(query) : [];
  const hasQuery = query.trim().length > 0;

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
                  Results for <em className="collection-head__em">“{query.trim()}”</em>
                </>
              ) : (
                <>
                  Search the <em className="collection-head__em">collection.</em>
                </>
              )}
            </h1>
            <p className="collection-head__intro">
              {hasQuery
                ? hits.length
                  ? `${hits.length} ${hits.length === 1 ? "match" : "matches"} — names, notes, and close spellings.`
                  : "No products matched that name. Try a note, a shorter spelling, or browse the collection."
                : "Type a product name, note, or mood. Close spellings still count."}
            </p>
          </header>
        </div>
      </section>

      <section className="grid-band search-page-grid">
        <div className="container container--full">
          {hits.length ? (
            <ul className="product-grid" role="list">
              {hits.map((product) => (
                <SearchProductCard key={product.id} product={product} />
              ))}
            </ul>
          ) : hasQuery ? (
            <p className="grid-band__empty">
              <Link href="/products">Explore the collection</Link>
            </p>
          ) : (
            <p className="grid-band__empty">Use the search icon in the header to find a scent by name.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SearchProductCard({ product }: { product: CatalogProduct }) {
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
            // eslint-disable-next-line @next/next/no-img-element
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
