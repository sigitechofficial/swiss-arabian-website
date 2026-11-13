# Checkout: test data button, card forms, Tabby

Updated 12 Nov 2026.

## "Fill test data" button

- **What:** at checkout, a "Fill test data" button at the top of Delivery fills the guest form with a UAE or KSA test order. Names and address lines say **TEST ORDER, do not ship**, and the emails use `example.com`, which is never delivered.
- **When it shows:**
  - not logged in
  - market country AE or SA
  - `NEXT_PUBLIC_APP_ENV` is not `production`
- **Code:** `features/checkout/utils/checkoutTestData.ts` (data and rules, tested in `checkoutTestData.spec.ts`), rendered in `components/CheckoutPageView.tsx` through the Delivery box's `beforeFields` slot.
- **Why:** testers placed orders by typing the same details every time. Test orders were also hard to spot in the admin, D365 and courier systems.
- **To change later:** add a market by adding its country to `TEST_DATA_COUNTRIES` with a test address. Logged-in testers use their saved address, so the button stays guest-only.

## Card forms (Stripe, Paymob)

- The card form opens through `POST /storefront/checkout/:id/inline-form`. A `ready: false` answer means the backend couldn't prepare it, and that's logged in the backend.
- On 12 Nov they failed everywhere because of backend credential lookup, not the website. See the backend doc `docs/payments/CARD_FORM_AND_CREDENTIAL_PACKS.md`. **Card (Telr)** never shows an inline form: it opens Telr's own payment page after "Continue to payment", so `ready: false` is normal there.

## Tabby

- Tabby shows as **"Pay later with Tabby"** when the market has a live Tabby method. Otherwise it's "Coming soon" under More ways to pay (`utils/methodLabels.ts` → `upcomingPaymentMethods`).
- **Test in Tabby's sandbox:** use **Fill test data**, then change the email to `otp.success@tabby.ai` and the phone to `500000001` (+971). Choose Tabby, continue, enter code **8888**, pick a plan. You come back to `/payments/tabby/return` and then the order confirmation.
  - Rejection test: phone `500000002`
  - Payment-page rejection: email `otp.rejected@tabby.ai`
- **Tested locally on 12 Nov:**
  - Order URD1-MWD58F9C-BCA184, captured in full.
  - Order URD1-MWD8EEO7-9F93FC, in "capture later" mode: captured 20 + 16 from the admin, rest released.
- **Not set up on Azure yet.** See the backend `docs/payments/TABBY_PROVIDER_CONTRACT.md` → Status.

## Related website changes, 11–12 Nov

- **Policies:** the built-in Shopify `/policies/*` and short addresses (`/refund-policy`, `/privacy-policy`, and so on) redirect to the footer policy pages, per market and in Arabic too. See `docs/storefront/PAGES_AND_POLICIES.md`.
- **Checkout Privacy Policy link:** it now goes to `/pages/privacy-policy`; it used to be a 404.
- **Previews:** `/pages/*` and `/policies/*` accept the admin's signed preview link and show a version with a "Preview" banner and noindex.
