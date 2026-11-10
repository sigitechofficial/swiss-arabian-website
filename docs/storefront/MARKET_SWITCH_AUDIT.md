# Market switch audit

Checked on 10 Nov 2026 in the browser on the local site (UAE, Qatar, Saudi Arabia). Every switch was made the way a shopper does it: the market selector in the top bar.

## How switching works

- The selector saves the chosen market (in the browser and in the `sa-zone-code` cookie).
- It refreshes everything loaded in the browser: catalog, menus, wishlist and promotions.
- It loads that market's cart.
- **From 10 Nov** it also redraws the parts the server drew (product, collection, page text, first prices, page title) for the new market.
- **Carts:** each market has **its own cart** for the same shopper (backend design). A Qatar bag stays in Qatar; switching back brings it back.

## Results per page

| Page | What happens on switch | Result |
|---|---|---|
| Home | Products, prices and menu follow the market (Qatar has no Home Fragrances) | OK |
| Collection in all markets (Cities) | Products and prices follow | **Fixed** (was: empty grid, old market's price filter) |
| Collection only in UAE (Experience Set) | Qatar/KSA: "not found"; switching back to UAE shows it | **Fixed** (was: stayed "not found") |
| Product in all markets (Casablanca) | AED 200 / QAR 230 / SAR 238, pay-in-4 amounts and page title follow | OK |
| Product only in UAE (Attar Ful) | Qatar: "not found"; switching to UAE shows it | OK after fix |
| Bag (drawer and page) | Shows the new market's own cart | **Fixed** (was: old market's lines with an "AED" total on QAR prices) |
| Checkout | Country fields, phone code, currency, VAT and payment options follow the market; another market's cart is empty there | **Fixed** phone code (was always +971) |
| Order confirmation | Keeps the order's own market and currency after a switch | OK |
| Search | Results and prices follow (UAE 63, Qatar 54 for "oud") | OK |
| Category, FAQ, track, stores, story, blog, sign-in, pages and policies | Load in every market | OK |
| Account pages (signed in) | **Not tested.** The local test account no longer exists, and a new one needs an email code; Mailpit is not running locally. | Open |

## Fixed on 10 Nov

| # | Problem | Cause | Fix |
|---|---|---|---|
| M1 | After a switch, collection pages kept an empty grid, or the old market's price filter | The server's first page of products (old market) was reused as fresh data for the new market | The first page carries its market and is used only for that market (`useCatalogPlp`) |
| M2 | Server-drawn parts (product, collection, page text, title) stayed in the old market | The switch refreshed only browser data | A switch redraws the server parts (`router.refresh()`). A "not found" page is loaded again, since it may exist in the new market. |
| M3 | Cookie and saved choice out of step after the cookie was cleared or went stale: the page drawn for one market, the header showing another | The saved choice won, but the page was not redrawn | When the cookie had to be corrected on load, the page is redrawn |
| M4 | The bag showed the old market's lines with a total in the new currency (e.g. QAR 230 with "AED 230") | (a) A guest's cart was not loaded on a switch when no cart id was saved. (b) A temporary error at start-up deleted the saved cart id. (c) Totals fell back to a fixed "AED". | (a) Load the market's cart by guest token. (b) Delete the id only when the cart really does not exist; retry once after a failed switch. (c) Currency from the cart, else its lines, else the market. |
| M5 | Checkout and sign-up phone started at +971 in every market | Fixed default country | The phone field starts on the selected market's country and follows a switch while empty |

Code: `src/providers/MarketProvider.tsx`, `src/providers/CartSessionProvider.tsx`, `src/features/catalog/hooks/useCatalogPlp.ts`, `src/features/collections/components/CollectionDetailPageView.tsx`, `src/app/(shop)/collections/[slug]/page.tsx`, `src/app/not-found.tsx`, `src/components/ui/PhoneNumberField.tsx`, `src/features/cart/utils/cartCurrency.ts` (+ test), cart page and drawer, `src/features/cart/utils/guestToken.ts`.

## Gaps still open

| # | Gap | Effect | Proposal |
|---|---|---|---|
| G1 | KSA shows UAE's policies and pages | KSA's store did not share its pages (Shopify permission), so the global (UAE) refund, shipping and privacy texts show in KSA | Store owner grants the permission, then import KSA; or write KSA versions in the admin |
| G2 | Delivery promise texts disagree | Product and checkout say "1–3 working days"; the top bar says "3–7 working days"; the same in every market | Delivery promise per market in the admin, used everywhere (the CMS announcement bar replaces the fixed top bar texts) |
| G3 | "Ships from Sharjah" in every market | Fixed text in the bag and checkout footer | Per market text or remove |
| G4 | Switching to a market where the cart is empty gives no hint | The shopper may think the bag was lost | A short note: "Your Qatar bag is saved; switch back to see it" |
| G5 | A page missing in the new market says only "Page not found" | Confusing after a switch | "Not available in Saudi Arabia" with a link to that market's collections |
| G6 | A temporary server error shows "This product is not available" | Same message as a product that does not exist | A "try again" message on errors |
| G7 | Gift cards and Gift box pages are placeholders ("Waiting on backend wiring") | Public pages with no function | Hide from menus and search engines until built |
| G8 | `/offers/{code}` answers normally for an unknown code | Search engines may index empty offer pages | Answer "not found" |
| G9 | No `/categories` list page | Only single categories exist | Add one, or keep it unlinked |
| G10 | Other fixed "AED" fallbacks (loyalty, promotions, gift messages) | Wrong currency only when data is missing | Same currency rule as the bag |
| G11 | Payment methods per market to confirm | Qatar offers Paymob; KSA does not. NAPS (Qatar debit) "coming soon". | Business to confirm the list per market |
| G12 | Order confirmation item has no picture | A letter placeholder instead of the product image | Show the line image |
| G13 | Signed-in account pages not checked | Orders, addresses, wishlist and rewards across markets | Run Mailpit locally (or a verified test account), then check |

Test order placed (local, dev-only Test Payment): `KSA-MWA2G6H3-315777`, SAR 238.00.
