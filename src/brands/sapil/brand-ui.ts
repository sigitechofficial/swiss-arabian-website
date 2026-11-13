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
export { SapilCartPage as CartPageView } from "./pages/checkout/SapilCartPage";
export { SapilCheckoutPage as CheckoutPageView } from "./pages/checkout/SapilCheckoutPage";
export {
  SapilCheckoutSpinner as CheckoutSpinnerState,
  SapilCheckoutStateShell as CheckoutStateShell,
  SapilPaymentCancel as PaymentCancelView,
  SapilPaymentSuccess as PaymentSuccessView,
  SapilPaymobPaymentForm as PaymobPaymentFormView,
  SapilStripePaymentForm as StripePaymentFormView,
  SapilTabbyReturn as TabbyReturnView,
  SapilTelrReturn as TelrReturnView,
} from "./pages/checkout/SapilPaymentScreens";
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
