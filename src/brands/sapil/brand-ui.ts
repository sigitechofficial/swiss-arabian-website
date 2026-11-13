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
export { SapilOrderConfirmationPage as OrderConfirmationView } from "./pages/orders/SapilOrderConfirmationPage";
export { SapilOrdersPage as PurchaseHistoryPageView } from "./pages/orders/SapilOrdersPage";
export { SapilOrderDetailPage as AccountOrderDetailPageView } from "./pages/orders/SapilOrderDetailPage";
export { SapilGuestTrackingPage as GuestTrackingPageView, SapilTrackLookupPage as TrackLookupView } from "./pages/orders/SapilTrackPages";

// --- auth + account ---
export {
  SapilForgotPasswordPage as ForgotPasswordPageView,
  SapilLoginPage as LoginPageView,
  SapilRegisterPage as RegisterPageView,
  SapilResetPasswordPage as ResetPasswordPageView,
  SapilVerifyPage as VerifyPageView,
} from "./pages/auth/SapilAuthPages";
// Loyalty / rewards, subscriptions, employee benefits and gift box are off for Sapil
// (brand features): their routes keep Swiss Arabian's views and Sapil never links to them.
export {
  SapilAccountAddressesPage as AccountAddressesPageView,
  SapilAccountAfterSalesPage as AccountAfterSalesPageView,
  SapilAccountPage as AccountPageView,
  SapilAccountProfilePage as AccountProfilePageView,
  SapilAccountReviewsPage as AccountReviewsPageView,
  SapilAccountSecurityPage as AccountSecurityPageView,
  SapilAccountWishlistPage as AccountWishlistPageView,
  SapilPaymentsPage as PaymentsPageView,
} from "./pages/account/SapilAccountPages";
