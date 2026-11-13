/**
 * Sapil's UI for every route (the brand UI contract, see src/brands/README.md).
 *
 * Starts from Swiss Arabian's components; each page Sapil has built in its own
 * design system (v9) is exported below by the same name and replaces the
 * default. An explicit export always wins over `export *`.
 * Keep each area's lines inside its block (see docs/sapil/BUILD_CONVENTIONS.md).
 */
export * from "../swiss-arabian/brand-ui";

export { BrandHead } from "./BrandHead";

// --- shell (StorefrontShell, error and 404 chrome) ---
export { SapilStorefrontShell as StorefrontShell } from "./components/shell/SapilStorefrontShell";
export { SapilCrashFallback as CrashFallback } from "./components/states/SapilErrorViews";
export { SapilShopUnavailableView as ShopUnavailableView } from "./components/states/SapilShopUnavailableView";

// --- home + content (HomePageView, Blog*, FaqPageView, SitePageView, …) ---
export { SapilHomePage as HomePageView } from "./pages/home/SapilHomePage";
export { SapilBlogPage as BlogPageView } from "./pages/content/SapilBlogPage";
export { SapilBlogArticlePage as BlogArticlePageView } from "./pages/content/SapilBlogArticlePage";
export { SapilFaqPage as FaqPageView } from "./pages/content/SapilFaqPage";
export { SapilSitePage as SitePageView } from "./pages/content/SapilSitePage";
export { SapilCollectionsPage as CollectionsPageView } from "./pages/content/SapilCollectionsPage";
// OfferShop: Swiss Arabian's (a large promotions page with its own logic; not rebuilt yet).

// --- catalog (listings, product page, search, collections) ---
export {
  SapilProductsListing as ProductsListing,
  SapilCollectionListing as CollectionListing,
  SapilCategoryListing as CategoryListing,
  SapilProductRoute as ProductDetailPageView,
  SapilSearchRoute as SearchPageView,
} from "./pages/catalog/SapilListings";

// --- bag, checkout, orders, tracking ---

// --- auth + account ---
