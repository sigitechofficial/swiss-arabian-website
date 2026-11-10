import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CollectionDetailPageView } from "@/features/collections";
import { CollectionSeoText } from "@/features/seo-footer/CollectionSeoText";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
  itemListJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  canonicalCatalogPath,
  catalogMetadata,
  loadCatalogDocument,
} from "@/lib/seo/catalogPage";
import {
  applySeoOverrides,
  loadPublishedPageSeo,
  pageJsonLd,
} from "@/lib/seo/pageSeo";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = parseCatalogListingParams(await searchParams);
  const { locale, collection, missing } = await loadCatalogDocument(
    "collection",
    slug,
  );
  if (missing) notFound();
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
      title:
        page > 1 ? `${title} – ${shopCopy(locale, "page")} ${page}` : title,
      description: description || undefined,
      image: collection?.image || null,
    }),
    // Page 2+ keeps its own canonical below.
    page > 1 && seo ? { ...seo, canonicalUrl: undefined } : seo,
  );
  // Page 2+ is its own page for search engines (self-canonical), not a copy of page 1.
  if (page > 1) {
    metadata.alternates = {
      ...metadata.alternates,
      canonical: `${path}?page=${page}`,
    };
  }
  return metadata;
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const listingQuery = parseCatalogListingParams(await searchParams);
  // Plain pages (no sort / price filter) are server-rendered, page 2+ included, so
  // search engines get the product links without running JavaScript.
  const serverRendered = !listingQuery.minPrice && !listingQuery.sort;
  const loaded = await loadCatalogDocument(
    "collection",
    slug,
    serverRendered ? listingQuery.page : 1,
  );
  const { locale, collection, listing, zoneCode } = loaded;
  // The collection does not exist in this market: a real 404, not a crash.
  if (loaded.missing) notFound();
  if (collection?.slug && collection.slug !== slug) {
    permanentRedirect(
      withLocalePrefix(`/collections/${collection.slug}`, locale),
    );
  }
  const handle = collection?.slug || slug;
  const path = canonicalCatalogPath(`/collections/${handle}`, locale);
  const name = collection?.name || slug;
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
          {
            name: shopCopy(locale, "home"),
            url: withLocalePrefix("/", locale),
          },
          { name, url: path },
        ])}
      />
      <CollectionDetailPageView
        slug={handle}
        listingQuery={listingQuery}
        collection={collection}
        initialListing={serverRendered ? listing : null}
        initialZoneCode={zoneCode}
      />
      {/* Above the footer: this collection's SEO text, else the market's (one block only). */}
      <CollectionSeoText
        content={collection?.seoContent}
        fallbackLocale={locale}
      />
    </>
  );
}
