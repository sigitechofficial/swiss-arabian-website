import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CatalogPageView } from "@/features/catalog/components/CatalogPageView";
import {
  CatalogPageViewFromUrl,
  CategoryDetailPageViewFromUrl,
  CollectionDetailPageViewFromUrl,
} from "@/features/catalog/components/ListingFromUrl";
import { CollectionDetailPageView } from "@/features/collections/components/CollectionDetailPageView";
import { CategoryDetailPageView } from "@/features/collections/components/CategoryDetailPageView";
import { CollectionSeoText } from "@/features/seo-footer/CollectionSeoText";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
  itemListJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { listingPageParam } from "@/lib/i18n/localeRouting";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import {
  canonicalCatalogPath,
  catalogMetadata,
  loadCatalogDocument,
  loadServerListing,
} from "@/lib/seo/catalogPage";
import {
  applySeoOverrides,
  loadPublishedPageSeo,
  pageJsonLd,
  pageMetadata,
} from "@/lib/seo/pageSeo";

/**
 * All products, a collection and a category: page 1 at the listing's own
 * route, page N at `…/p/[page]` (the proxy maps `?page=N` there). Neither
 * reads the request, so every page is prerendered and revalidated (ISR);
 * sort and price filters are applied in the browser.
 */

/** Seconds a prerendered catalog page is served before it is rebuilt. */
export const CATALOG_REVALIDATE_SECONDS = 300;

/** `[page]` route param → page number; page 1 has its own address. */
export function routePage(value: string | undefined): number {
  const page = listingPageParam(value);
  if (page <= 1 || String(page) !== value) notFound();
  return page;
}

function withPageCanonical(metadata: Metadata, path: string, page: number): Metadata {
  // Page 2+ is its own page for search engines (self-canonical), not a copy of page 1.
  if (page > 1) {
    metadata.alternates = {
      ...metadata.alternates,
      canonical: `${path}?page=${page}`,
    };
  }
  return metadata;
}

/* ---------------------------------------------------------------- products */

export async function productsMetadata(page: number): Promise<Metadata> {
  const { locale, t } = await routeTranslator();
  const title = t("allProducts");
  const metadata = await pageMetadata({
    path: "/products",
    title: page > 1 ? t("listing.pageTitle", { title, page }) : title,
    listing: true,
  });
  const canonical = metadata.alternates?.canonical;
  const base =
    typeof canonical === "string" ? canonical : withLocalePrefix("/products", locale);
  return withPageCanonical(metadata, base, page);
}

export async function ProductsListing({ page }: { page: number }) {
  const { listing, zoneCode } = await loadServerListing("products", "", page);
  const props = { initialListing: listing, initialZoneCode: zoneCode };
  return (
    <Suspense fallback={<CatalogPageView {...props} listingQuery={{ page }} />}>
      <CatalogPageViewFromUrl {...props} serverPage={page} />
    </Suspense>
  );
}

/* ------------------------------------------------------------- collections */

export async function collectionMetadata(slug: string, page: number): Promise<Metadata> {
  const { locale, collection, missing } = await loadCatalogDocument("collection", slug);
  if (missing) notFound();
  const { t } = await routeTranslator();
  const handle = collection?.slug || slug;
  // SEO Management (a page for this address) wins, then the collection's own SEO fields.
  const { seo } = await loadPublishedPageSeo(`/collections/${handle}`);
  const title =
    seo?.title || collection?.seoTitle?.trim() || collection?.name || slug;
  const description =
    seo?.description ||
    collection?.seoDescription?.trim() ||
    collection?.description ||
    undefined;
  const path = canonicalCatalogPath(`/collections/${handle}`, locale);
  const metadata = applySeoOverrides(
    await catalogMetadata({
      locale,
      path,
      title: page > 1 ? t("listing.pageTitle", { title, page }) : title,
      description: description || undefined,
      image: collection?.image || null,
      listing: true,
    }),
    // Page 2+ keeps its own canonical below.
    page > 1 && seo ? { ...seo, canonicalUrl: undefined } : seo,
  );
  return withPageCanonical(metadata, path, page);
}

export async function CollectionListing({ slug, page }: { slug: string; page: number }) {
  // Page 2+ included, so search engines get the product links without running JavaScript.
  const loaded = await loadCatalogDocument("collection", slug, page);
  const { locale, collection, listing, zoneCode } = loaded;
  // The collection does not exist in this market: a real 404, not a crash.
  if (loaded.missing) notFound();
  if (collection?.slug && collection.slug !== slug) {
    const target = withLocalePrefix(`/collections/${collection.slug}`, locale);
    permanentRedirect(page > 1 ? `${target}?page=${page}` : target);
  }
  const { t } = await routeTranslator();
  const handle = collection?.slug || slug;
  const path = canonicalCatalogPath(`/collections/${handle}`, locale);
  const name = collection?.name || slug;
  const props = {
    slug: handle,
    collection,
    initialListing: listing,
    initialZoneCode: zoneCode,
  };
  return (
    <>
      {(await pageJsonLd(`/collections/${handle}`)).map((data, index) => (
        <CatalogJsonLd key={`admin-${index}`} data={data} />
      ))}
      {listing?.products.length ? (
        <CatalogJsonLd
          data={itemListJsonLd(
            name,
            listing.products.map((p) =>
              withLocalePrefix(`/products/${p.slug}`, locale),
            ),
          )}
        />
      ) : null}
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: t("home"), url: withLocalePrefix("/", locale) },
          { name, url: path },
        ])}
      />
      <Suspense fallback={<CollectionDetailPageView {...props} listingQuery={{ page }} />}>
        <CollectionDetailPageViewFromUrl {...props} serverPage={page} />
      </Suspense>
      {/* Above the footer: this collection's SEO text, else the market's (one block only). */}
      <CollectionSeoText
        content={collection?.seoContent}
        fallbackLocale={locale}
      />
    </>
  );
}

/* -------------------------------------------------------------- categories */

export async function categoryMetadata(slug: string, page: number): Promise<Metadata> {
  const { locale, category, missing } = await loadCatalogDocument("category", slug);
  if (missing) notFound();
  const { t } = await routeTranslator();
  const handle = category?.slug || slug;
  // SEO Management (a page for this address) wins, then the category's own SEO fields.
  const { seo } = await loadPublishedPageSeo(`/categories/${handle}`);
  const title =
    seo?.title || category?.seoTitle?.trim() || category?.name || slug;
  const path = canonicalCatalogPath(`/categories/${handle}`, locale);
  const metadata = applySeoOverrides(
    await catalogMetadata({
      locale,
      path,
      title: page > 1 ? t("listing.pageTitle", { title, page }) : title,
      description:
        seo?.description ||
        category?.seoDescription?.trim() ||
        category?.description ||
        undefined,
      image: seo?.ogImage || category?.image || null,
      listing: true,
    }),
    // Page 2+ keeps its own canonical below.
    page > 1 && seo ? { ...seo, canonicalUrl: undefined } : seo,
  );
  return withPageCanonical(metadata, path, page);
}

export async function CategoryListing({ slug, page }: { slug: string; page: number }) {
  const { locale, category, missing } = await loadCatalogDocument("category", slug);
  if (missing) notFound();
  if (category?.slug && category.slug !== slug) {
    const target = withLocalePrefix(`/categories/${category.slug}`, locale);
    permanentRedirect(page > 1 ? `${target}?page=${page}` : target);
  }
  const { t } = await routeTranslator();
  const handle = category?.slug || slug;
  const { listing, zoneCode } = await loadServerListing("category", handle, page);
  const path = canonicalCatalogPath(`/categories/${handle}`, locale);
  const name = category?.name || slug;
  const props = {
    slug: handle,
    category,
    initialListing: listing,
    initialZoneCode: zoneCode,
  };
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: t("home"), url: withLocalePrefix("/", locale) },
          { name, url: path },
        ])}
      />
      <Suspense fallback={<CategoryDetailPageView {...props} listingQuery={{ page }} />}>
        <CategoryDetailPageViewFromUrl {...props} serverPage={page} />
      </Suspense>
    </>
  );
}
