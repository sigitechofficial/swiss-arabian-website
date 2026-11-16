import type { ComponentProps } from "react";
import {
  CategoryListing,
  CollectionListing,
  ProductsListing,
} from "@/features/catalog/routes/listingRoutes";
import { CatalogCopy } from "../../components/catalog/CatalogCopy";
import { SapilCollectionSeoText } from "../../components/catalog/SapilCollectionSeoText";
import { SapilProductPage } from "./SapilProductPage";
import { SapilSearchPage } from "./SapilSearchPage";
import {
  SapilCategoryView,
  SapilCategoryViewFromUrl,
  SapilCollectionView,
  SapilCollectionViewFromUrl,
  SapilShopView,
  SapilShopViewFromUrl,
} from "./SapilListingViews";

/**
 * Sapil's catalog routes (brand UI contract): the shared route components
 * (server data loading, redirects, JSON-LD, prerendering) with Sapil's client
 * views, inside Sapil's wording for the route's language.
 * `/products?under=<tier>` is the price edit (see docs/sapil/pages/catalog.md).
 */
export async function SapilProductsListing({ page }: { page: number }) {
  return (
    <CatalogCopy>
      <ProductsListing page={page} view={{ View: SapilShopView, FromUrl: SapilShopViewFromUrl }} />
    </CatalogCopy>
  );
}

export async function SapilCollectionListing({ slug, page }: { slug: string; page: number }) {
  return (
    <CatalogCopy>
      <CollectionListing
        slug={slug}
        page={page}
        view={{ View: SapilCollectionView, FromUrl: SapilCollectionViewFromUrl, SeoText: SapilCollectionSeoText }}
      />
    </CatalogCopy>
  );
}

export async function SapilCategoryListing({ slug, page }: { slug: string; page: number }) {
  return (
    <CatalogCopy>
      <CategoryListing slug={slug} page={page} view={{ View: SapilCategoryView, FromUrl: SapilCategoryViewFromUrl }} />
    </CatalogCopy>
  );
}

/** `/products/[handle]` (the route keeps metadata, Open Graph and JSON-LD). */
export function SapilProductRoute(props: ComponentProps<typeof SapilProductPage>) {
  return (
    <CatalogCopy>
      <SapilProductPage {...props} />
    </CatalogCopy>
  );
}

/** `/search?q=`. */
export function SapilSearchRoute(props: ComponentProps<typeof SapilSearchPage>) {
  return (
    <CatalogCopy>
      <SapilSearchPage {...props} />
    </CatalogCopy>
  );
}
