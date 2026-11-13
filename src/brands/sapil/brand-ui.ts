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

// --- home + content (HomePageView, Blog*, FaqPageView, SitePageView, …) ---

// --- catalog (listings, product page, search, collections) ---

// --- bag, checkout, orders, tracking ---
export { SapilCartPage as CartPageView } from "./pages/checkout/SapilCartPage";
export { SapilCheckoutPage as CheckoutPageView } from "./pages/checkout/SapilCheckoutPage";

// --- auth + account ---
