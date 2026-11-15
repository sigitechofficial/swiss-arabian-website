# Sapil: sign-in and account pages

Design-system pages (no v9 design): centred card on paper for sign-in, the order-page
layout (white cards on paper, chips for the section nav) for the account. Review gate:
these go live only after design review.

## Routes and components

| Route | `@brand-ui` name | Sapil component |
|---|---|---|
| `/login` | `LoginPageView` | `pages/auth/SapilAuthPages.tsx` → `SapilLoginForm` |
| `/register` | `RegisterPageView` | `SapilRegisterForm` |
| `/verify` | `VerifyPageView` | `SapilVerifyForm` |
| `/forgot-password` | `ForgotPasswordPageView` | `SapilForgotPasswordForm` |
| `/reset-password` | `ResetPasswordPageView` | `SapilResetPasswordForm` |
| `/account` | `AccountPageView` | `pages/account/SapilAccountPages.tsx` → `SapilAccountPage` |
| `/account/profile` | `AccountProfilePageView` | `SapilAccountProfilePage` |
| `/account/addresses` | `AccountAddressesPageView` | `SapilAccountAddressesPage` |
| `/account/security` | `AccountSecurityPageView` | `SapilAccountSecurityPage` |
| `/account/wishlist`, `/account/saved` | `AccountWishlistPageView` | `SapilAccountWishlistPage` |
| `/account/reviews` | `AccountReviewsPageView` | `SapilAccountReviewsPage` |
| `/account/returns` | `AccountAfterSalesPageView` | `SapilAccountAfterSalesPage` |
| `/account/payments` | `PaymentsPageView` | `SapilPaymentsPage` |

- The `(auth)` routes have **no storefront shell**, so `SapilAuthFrame` (server) brings
  `SapilRoot`, `theme.css`, `SapilCopyProvider` (wording for the route's language) and the
  logo back to `/`.
- Account pages render inside the shell (`(account)` layout + `AuthGuard`: signed out →
  `/login`).
- Shared parts: `components/account/AccountChrome.tsx` (page head, section chips,
  status pills, cards, load error), `FormCard.tsx`, `AuthFields.tsx` (password field with
  show/hide, code field, inline auth messages), `components/commerce/SapilPhoneField.tsx`
  (market dial code prefix, reports E.164).

## Brand features off for Sapil

Loyalty / rewards, subscriptions, employee benefits and gift box are off in
`src/lib/brand/brands/sapil.ts`. Their routes (`/account/rewards`, `/account/membership`,
`/account/subscription*`, `/account/employee-benefits`, `/gift-box`) still render
**Swiss Arabian's views** (not overridden). Sapil's account navigation
(`SAPIL_ACCOUNT_NAV`), dashboard tiles, bag, checkout and order pages never link to them.
`/account/saved` (same view as wishlist) is not linked either.

## Data sources (shared hooks only)

| Page | Hooks |
|---|---|
| Sign in / register / verify / forgot / reset | `features/auth/hooks/useAuthForms.ts`: `useLoginFlow`, `useRegisterForm`, `useVerifyForm`, `useForgotPasswordForm`, `useResetPasswordForm`, `useMarketDialCode` |
| Dashboard | `useAccountDashboard` (customer, greeting, latest order, address book, sign out) |
| Profile | `useUpdateCustomerMe`, `useCustomerPhones`, `useMarketingConsents` |
| Addresses | `useCustomerAddresses`, `addressFormToDto` |
| Security | `useChangePassword` |
| Wishlist | `useAccountWishlist`, `useWishlistMutations`, `useAddToCart` |
| Reviews | `useMyReviewsFeed`, `useReviewMutations` |
| Returns | `useCustomerReturnsFeed`, `useCustomerExchangesFeed` |
| Payments | `usePaymentHistory` (+ `paymentFilterOf`, `orderNeedsPaying`) |

## Hooks extracted (Swiss Arabian components now use them, no visible change)

| Hook | Swiss Arabian component |
|---|---|
| `useLoginFlow`, `useRegisterForm`, `useVerifyForm`, `useForgotPasswordForm`, `useResetPasswordForm` | `LoginPageView`, `RegisterPageView`, `VerifyPageView`, `ForgotPasswordPageView`, `ResetPasswordPageView` (notices / errors go to optional handlers; default = the same toasts as before) |
| `useAccountDashboard`, `useChangePassword` | `AccountPageView`, `AccountSecurityPageView` |
| `useAccountWishlist` | `AccountWishlistPageView` |
| `usePaymentHistory` | `PaymentsPageView` |
| `addressFormToDto` | `AccountAddressesPageView` |

## States and accessibility

- Loading: pastel skeletons; errors: "We couldn't load this right now. / Try again"; empty
  states with a way to the shop.
- Auth errors and notices are shown inline in a `role="alert"` / `role="status"` message
  (Sapil does not use the global toaster for auth); field errors are linked to the input
  (`aria-describedby`, `aria-invalid`) and react-hook-form focuses the first invalid field.
- Every string from `messages/{en,ar}/account.json`.

## Known differences / open questions

- No v9 design: needs design review.
- The shared account mutation hooks (`useCustomerAddresses`, `useCustomerPhones`,
  `useMarketingConsents`, `useUpdateCustomerMe`, wishlist) raise shared `toast()` calls.
  They are drawn by `SapilToastHost` (Sapil's v9 toast), but the sentences are the shared
  English ones until the hooks take their messages from the caller.
- API error text (`getUserFacingErrorMessage`) and cancel / refund outcome sentences
  (`cancelOutcome`, `refundCustomerStatus`) are English from shared utils.
- Wishlist uses the shared `SapilProductCard` (tile, was-price, out-of-stock pill, quick
  view, + to bag); the heart is off there because each card has its own "Remove" link.
- Returns page lists requests only; starting a return / exchange stays on the order
  (`OrderAfterSalesSection` is Swiss-styled and not rendered on Sapil's order detail yet:
  the order detail links to the returns page).
- Social sign-in buttons (`env.flags.oauth`) are not rendered on Sapil.
- Region and country names in address forms come from `regionsByCountry` (English).

## Review 2 (2026-11-13)

- Live: sign-in labels, empty submit (inline errors + focus on the first), wrong password (inline
  `role="alert"`), register validation, forgot password → reset page, verify page, signed-out
  `/account/*` → `/login?returnTo=…`. All pass.
- ~~Forgot password puts the email in the reset URL~~ ✅ final UI check: `useForgotPasswordForm`
  keeps the identifier in this tab's sessionStorage (`features/auth/utils/resetIdentifier.ts`) and
  opens `/reset-password` with no query; `useResetPasswordForm` fills it in after hydration and
  clears it once the password is set (tests: `usePasswordReset.spec.tsx`).
- ~~From `/ar/login`, "Create account" opens the English `/register`~~ ✅ final UI check: sign-in,
  register, forgot / reset, verify and the account guard keep `/ar` (`localizeHref` +
  `useLocaleRouter`); `/ar/account` signed out → `/ar/login?returnTo=%2Far%2Faccount`.
