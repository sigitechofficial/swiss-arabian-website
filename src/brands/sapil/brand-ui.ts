/**
 * Sapil's UI for every route (the brand UI contract, see src/brands/README.md).
 *
 * Every name of the contract is exported here by name (no `export *` of
 * Swiss Arabian's barrel, which pulled its whole UI into Sapil's bundles).
 * `src/brands/contract.check.ts` fails the type check if a name is missing.
 * Keep each area's lines inside its block (see docs/sapil/BUILD_CONVENTIONS.md).
 */
export { BrandHead } from "./BrandHead";

// --- shared, brand-neutral parts (nothing visible: JSON-LD script, a path-based slot) ---
// Imported from their own modules (not from feature barrels) so nothing else comes along.
export { CatalogJsonLd } from "@/features/catalog/components/CatalogJsonLd";
export { MarketSeoTextSlot } from "@/features/seo-footer/MarketSeoTextSlot";
// --- Sapil's own loading / placeholder / SEO text ---
export { SapilPageLoading as PageLoading } from "./components/states/SapilPageLoading";
export {
  SapilFeaturePlaceholder as FeaturePlaceholder,
  SapilOurStoryFallback as OurStoryFallbackView,
} from "./components/states/SapilPlaceholders";
export { SapilFooterSeoText as FooterSeoText } from "./components/shell/SapilFooterSeoText";
// Off for Sapil (brand features): every route below answers "not found" before it renders
// (requireBrandFeature) and is never linked. Swiss Arabian's views stay only to fill the contract.
export { AccountPlaceholderPageView } from "@/features/account/components/AccountPlaceholderPageView";
export { AccountRewardsPageView } from "@/features/account/components/AccountRewardsPageView";
export { EmployeeBenefitsAccountView as AccountEmployeeBenefitsPageView } from "@/features/employeeBenefits/components/EmployeeBenefitsAccountView";
export { AccountSubscriptionDetailPageView } from "@/features/subscriptions/components/AccountSubscriptionDetailPageView";
export { AccountSubscriptionsPageView } from "@/features/subscriptions/components/AccountSubscriptionsPageView";
export { SubscriptionCheckoutPageView } from "@/features/subscriptions/components/SubscriptionCheckoutPageView";
export { SubscriptionsPageView } from "@/features/subscriptions/components/SubscriptionsPageView";

// --- shell (StorefrontShell, error and 404 chrome) ---
export { SapilStorefrontShell as StorefrontShell } from "./components/shell/SapilStorefrontShell";
export { SapilCrashFallback as CrashFallback } from "./components/states/SapilErrorViews";
export { SapilShopUnavailableView as ShopUnavailableView } from "./components/states/SapilShopUnavailableView";

// --- home + content (HomePageView, Blog*, FaqPageView, SitePageView, …) ---
export { SapilHomePage as HomePageView } from "./pages/home/SapilHomePage";
export { SapilCmsPreviewHome as CmsPreviewHomeView } from "./pages/home/SapilCmsPreviewHome";
export { SapilBlogPage as BlogPageView } from "./pages/content/SapilBlogPage";
export { SapilBlogArticlePage as BlogArticlePageView } from "./pages/content/SapilBlogArticlePage";
export { SapilFaqPage as FaqPageView } from "./pages/content/SapilFaqPage";
export { SapilSitePage as SitePageView } from "./pages/content/SapilSitePage";
export { SapilSitePageRoute as SitePageRoute } from "./pages/content/SapilSitePageRoute";
export { SapilCollectionsPage as CollectionsPageView } from "./pages/content/SapilCollectionsPage";
export { SapilReviewRequestPage as ReviewRequestPageView } from "./pages/content/SapilReviewRequestPage";
export { SapilOfferPage as OfferPageView } from "./pages/content/SapilOfferPage";
export {
  SapilStoreLocatorPage as StoreLocatorPageView,
  SapilStoreAreaPage as StoreAreaPageView,
  SapilStorePage as StorePageView,
} from "./pages/content/SapilStorePages";

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
  SapilTabbyReturn as TabbyReturnView,
  SapilTelrReturn as TelrReturnView,
} from "./pages/checkout/SapilPaymentScreens";
export {
  SapilPaymobPaymentForm as PaymobPaymentFormView,
  SapilStripePaymentForm as StripePaymentFormView,
} from "./pages/checkout/SapilCardPayment";
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
