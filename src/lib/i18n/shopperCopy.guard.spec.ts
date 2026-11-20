import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findHardCodedCopy, looksLikeProse } from "@/test/hardCodedCopy";

/**
 * Shopper pages whose wording lives in `src/messages/<locale>.json`. A sentence
 * written into one of these files again would show English on every other
 * language's pages, so the scan fails until it moves to a message key (or is
 * allow-listed below with a reason).
 */
const SCOPE = [
  "features/subscriptions/components/SubscriptionsPageView.tsx",
  "features/subscriptions/components/SubscriptionCheckoutPageView.tsx",
  "features/subscriptions/components/PlanSelectionPageView.tsx",
  "features/subscriptions/components/SubscriptionCheckoutSuccess.tsx",
  "features/subscriptions/components/SubscriptionManageSection.tsx",
  "features/subscriptions/components/SubscriptionMonthlyTracker.tsx",
  "features/subscriptions/components/SubscriptionPaymentMethodSection.tsx",
  "features/subscriptions/components/SubscriptionPaymentRecoverySection.tsx",
  "features/subscriptions/components/SubscriptionCardSetup.tsx",
  "features/subscriptions/utils/subscriptionManagement.ts",
  "features/subscriptions/utils/subscriptionRules.ts",
  "features/subscriptions/utils/subscriptionCheckout.ts",
  "features/subscriptions/utils/subscriptionMonthlyTracker.ts",
  "features/subscriptions/utils/cardSetup.ts",
  "features/subscriptions/utils/firstPayment.ts",
  "features/subscriptions/components/AccountSubscriptionDetailPageView.tsx",
  "features/checkout/components/OrderConfirmationView.tsx",
  "features/checkout/components/TelrReturnView.tsx",
  "features/checkout/components/PaymentSuccessView.tsx",
  "features/checkout/components/TamaraReturnView.tsx",
  "features/checkout/components/TabbyReturnView.tsx",
  "features/checkout/components/CheckoutPageView.tsx",
  "features/checkout/components/StripePaymentFormView.tsx",
  "features/checkout/components/PaymobPaymentFormView.tsx",
  "features/checkout/components/PaymentCancelView.tsx",
  "features/checkout/components/checkout/CheckoutDelivery.tsx",
  "features/checkout/components/checkout/CheckoutBilling.tsx",
  "features/checkout/utils/tabby.ts",
  "features/checkout/utils/tamara.ts",
  "features/employeeBenefits/components/StaffDiscountSummary.tsx",
  "features/home/components/landing/LandingBundles.tsx",
  "features/search/components/SearchPageView.tsx",
  "features/cart/components/CartPageView.tsx",
  "features/cart/components/CartSideSheet.tsx",
  "features/promotions/components/GiftCardForm.tsx",
  "features/promotions/components/MoneySummary.tsx",
  "features/promotions/components/GiftChoiceModal.tsx",
  "features/loyalty/components/LoyaltyRedemptionEditor.tsx",
  "features/onsite/design/OnsiteDesignView.tsx",
  "features/catalog/components/pdp/PdpComposition.tsx",
  "features/cms/components/CmsPreviewHomeView.tsx",
  "features/checkout/components/checkout/CheckoutSummary.tsx",
  "features/checkout/components/checkout/CheckoutPayment.tsx",
  "features/checkout/components/checkout/CheckoutShippingMethod.tsx",
  "features/checkout/components/checkout/InlineMethodPayment.tsx",
  "features/checkout/components/StripeCardPaymentForm.tsx",
  "features/checkout/components/PaymobThreeDsModal.tsx",
  "features/checkout/components/EmphasisCopy.tsx",
  "features/checkout/hooks/useStripeCardPayment.ts",
  "features/checkout/utils/paymentOptions.ts",
  "features/checkout/utils/methodLabels.ts",
  "features/cart/components/MissThisSwiper.tsx",
  "features/cart/constants/validationMessages.ts",
  "features/promotions/components/CouponForm.tsx",
  "features/promotions/components/GiftWithPurchase.tsx",
  "features/promotions/components/GiftCartItem.tsx",
  "features/promotions/utils/giftWithPurchase.ts",
  "features/loyalty/components/EarnPreviewNote.tsx",
  "features/loyalty/components/LoyaltyDrawerNote.tsx",
  "features/employeeBenefits/types/employeeCheckout.ts",
  "features/search/constants.ts",
  "features/onsite/components/OnsiteMessageView.tsx",
  "features/catalog/constants/productBadges.ts",
  "features/catalog/components/ProductCardTags.tsx",
  "features/catalog/components/catalog/CatalogToolbar.tsx",
  "features/catalog/components/catalog/CatalogFilters.tsx",
  "features/catalog/components/catalog/CatalogCollectionEmpty.tsx",
  "features/catalog/components/catalog/CatalogProductCard.tsx",
  "features/catalog/components/CatalogEmptyState.tsx",
  "features/catalog/components/CatalogInfiniteSentinel.tsx",
  "features/catalog/components/ProductDetailPageView.tsx",
  "features/catalog/components/pdp/PdpGallery.tsx",
  "features/catalog/components/pdp/PdpRelatedRail.tsx",
  "features/catalog/components/pdp/PdpInstalments.tsx",
  "features/catalog/components/pdp/PdpBuyBox.tsx",
  "features/catalog/utils/pdpShipping.ts",
  "features/catalog/hooks/useProductDetailPage.ts",
  "components/layout/navbar/NavbarSearchDropdown.tsx",
  "components/layout/SearchOverlay.tsx",
  "components/ui/CrashFallback.tsx",
  "components/ui/ShopUnavailableView.tsx",
  "components/ui/ForbiddenView.tsx",
  "features/blog/components/BlogArticlePageView.tsx",
  "features/blog/components/BlogRelatedArticles.tsx",
  "features/blog/components/BlogPageView.tsx",
  "features/promotions/components/PromotionOffers.tsx",
  "features/promotions/components/ProductCompanions.tsx",
  "features/promotions/components/PromotionUnlockNote.tsx",
  "features/promotions/utils/qualificationCopy.ts",
  "features/promotions/utils/conflictNotes.ts",
  "features/home/components/landing/LandingTrending.tsx",
  "features/home/components/landing/LandingProductsBand.tsx",
  "features/home/components/landing/LandingNotes.tsx",
  "features/home/components/landing/LandingHero.tsx",
  "features/home/components/landing/LandingReviews.tsx",
  "features/home/components/landing/LandingPlans.tsx",
  "features/home/components/NewsletterSection.tsx",
  "features/cms/components/CmsHomePageView.tsx",
  "features/faq/components/FaqHelp.tsx",
  "features/faq/components/FaqCabinet.tsx",
];

/** Brand and payment scheme names: written the same in every language. */
const PAYMENT_NAMES = [
  "Stripe",
  "Paymob",
  "Apple Pay",
  "Google Pay",
  "STC Pay",
  "Visa, Mastercard",
  "Visa, Mastercard, Amex",
  "Stripe · Visa, Mastercard, Amex",
  "Paymob · Visa, Mastercard, Amex, Jaywan",
];

/**
 * Text allowed to stay in the source, by file, each with its reason. Anything
 * else a shopper reads belongs in `src/messages/<locale>.json`.
 */
const ALLOWED: Record<string, string[]> = {
  // English phrases the tests assert a pending registration never shows (not rendered).
  "features/subscriptions/utils/subscriptionRules.ts": [
    "payment successful",
    "order confirmed",
    "delivery confirmed",
    "next charge",
    "automatically renews",
    "active subscription",
  ],
  // Provider names shown as the provider's mark.
  "features/checkout/components/TabbyReturnView.tsx": ["Tabby"],
  "features/checkout/components/TamaraReturnView.tsx": ["Tamara"],
  "features/checkout/components/StripePaymentFormView.tsx": ["Visa · Mastercard · Amex"],
  "features/checkout/components/PaymobPaymentFormView.tsx": ["Visa · Mastercard"],
  // Tabby's / Tamara's own mandated wording ({en, ar} provider texts, see providerText.ts).
  "features/checkout/utils/tabby.ts": [
    "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.",
    "You aborted the payment. Please retry or choose another payment method.",
    "Pay later with Tabby",
    "4 payments of {} {} /mo or up to 12 months.",
  ],
  "features/checkout/utils/tamara.ts": [
    "Sorry, Tamara is not available for this order. Please use an alternative payment method.",
    "Tamara could not approve this purchase. Please choose another payment method.",
    "You cancelled the Tamara payment. Please retry or choose another payment method.",
    "Split into 4 interest-free payments of {} {} with Tamara.",
  ],
  "features/checkout/utils/methodLabels.ts": PAYMENT_NAMES,
  "features/checkout/utils/paymentOptions.ts": PAYMENT_NAMES,
  // Card scheme marks and the Tamara wordmark (logos drawn as text).
  "features/checkout/components/checkout/CheckoutPayment.tsx": ["tamara", "VISA", "AMEX"],
  // Processor name; "Pay" is part of the Apple Pay / Google Pay marks.
  "features/checkout/components/checkout/InlineMethodPayment.tsx": ["Paymob", "Pay"],
  // Tailwind class lists the scan reads as words; the concentration term is product data.
  "features/home/components/landing/LandingBundles.tsx": [
    "group/campaign relative grid min-h-[clamp(440px,46vw,620px)] place-items-center overflow-hidden max-[1023px]:block max-[1023px]:min-h-0 max-[1023px]:data-[open=true]:[&_[data-campaign-actions]]:pointer-events-none max-[1023px]:data-[open=true]:[&_[data-campaign-actions]]:invisible max-[767px]:aspect-[535/690] max-[767px]:max-h-[min(68vh,620px)] min-[768px]:max-[1023px]:aspect-[16/10] min-[1024px]:place-items-end min-[1024px]:bg-[#e6c9a8]",
    "mt-[0.2rem] block truncate text-[0.66rem] tracking-[0.09em] text-white/60 uppercase max-[1023px]:text-[rgba(36,31,27,0.55)]",
    "Eau de Parfum",
  ],
  // Catalog tag values the badge rule matches (data, not shown).
  "features/catalog/constants/productBadges.ts": ["best seller", "best sellers", "new launch", "new launches"],
  // The catalog's placeholder text, matched to hide it (not shown).
  "features/catalog/hooks/useProductDetailPage.ts": ["Product details will appear"],
  // Social network names and typographic quotes.
  "features/blog/components/BlogArticlePageView.tsx": ["Facebook", "Instagram", "&ldquo;", "&rdquo;"],
  // Inline CSS / class values the scan reads as words.
  "features/catalog/components/pdp/PdpInstalments.tsx": [
    "conic-gradient(var(--copper, #8c4435) {} deg, rgb(140 68 53 / 0.14) 0)",
  ],
  "features/promotions/components/ProductCompanions.tsx": [
    "group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-2 transition-[border-color,box-shadow,background-color] duration-200",
  ],
  // Shared with the admin (no app imports): English defaults for `words` (the website passes
  // its own), inline CSS values, and labels drawn only while editing in the admin playground.
  "features/onsite/design/OnsiteDesignView.tsx": [
    "Please enter a valid email address.",
    "Please enter your phone number.",
    "Please tick the box to agree.",
    "Something went wrong. Please try again.",
    "This form is not available right now.",
    "Time left",
    "Close",
    "Message",
    "var(--font-heading, var(--font-serif, Georgia, 'Times New Roman', serif))",
    "@keyframes sa-onsite-fade { from { opacity: 0 } to { opacity: 1 } } @keyframes sa-onsite-zoom { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: scale(1) } } @keyframes sa-onsite-slide-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } } @keyframes sa-onsite-slide-down { from { opacity: 0; transform: translateY(-24px) } to { opacity: 1; transform: translateY(0) } } @media (prefers-reduced-motion: reduce) { [data-onsite-box] { animation: none !important } }",
    "12px solid transparent",
    "transform {} ms cubic-bezier(.17,.67,.12,.99)",
    "Add your image",
    "Edit element {}",
    "1px dashed transparent",
    "min( {} px, calc(100% - 32px))",
  ],
};

const root = path.resolve(__dirname, "../..");

describe("shopper pages have no hard-coded English", () => {
  it.each(SCOPE)("%s", (file) => {
    const source = readFileSync(path.join(root, file), "utf8");
    const allowed = new Set(ALLOWED[file] ?? []);
    const found = findHardCodedCopy(source, file)
      .filter((hit) => !allowed.has(hit.text))
      .map((hit) => `${file}:${hit.line} ${JSON.stringify(hit.text)}`);
    expect(found).toEqual([]);
  });
});

describe("the scan", () => {
  it("finds JSX text, prose attributes, toasts and plural templates", () => {
    const source = `
      export function View({ n }: { n: number }) {
        toast.error("Could not save your address.");
        const label = \`\${n} products\`;
        return (
          <section aria-label="Order summary" className="flex items-center gap-2">
            <h2>Thank you</h2>
            <input placeholder="Search" />
            <p>{label}</p>
          </section>
        );
      }`;
    expect(findHardCodedCopy(source).map((hit) => hit.text)).toEqual([
      "Could not save your address.",
      "{} products",
      "Order summary",
      "Thank you",
      "Search",
    ]);
  });

  it("skips code: imports, classes, keys, comparisons, types and developer errors", () => {
    const source = `
      import { Thing } from "Some Module";
      type Tone = "Very Good";
      const key = "checkout.confirmation.title";
      export function View({ status }: { status: string }) {
        if (status === "Payment Pending") throw new Error("Not reachable here");
        console.warn("Something odd happened");
        return <div className="relative flex w-full" data-state="Open Now">{t("home")}</div>;
      }`;
    expect(findHardCodedCopy(source)).toEqual([]);
  });

  it("tells words from identifiers", () => {
    expect(looksLikeProse("Subtotal")).toBe(true);
    expect(looksLikeProse("Choose Men or Women.")).toBe(true);
    expect(looksLikeProse("PENDING_PAYMENT")).toBe(false);
    expect(looksLikeProse("rounded-full px-3 py-1")).toBe(false);
    expect(looksLikeProse("subscriptions.plan.queueFull")).toBe(false);
  });
});
