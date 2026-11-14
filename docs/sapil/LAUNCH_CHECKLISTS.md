# Sapil launch checklists

For the business, finance, IT and legal owners. Each section says who acts,
what to do, and what the development team needs back. Status as of
2026-11-14 (local testing).

---

## 1. Payment accounts (owner: finance / payments)

Locally, Sapil pays through **Swiss Arabian's test accounts** (Stripe, Tabby,
Paymob, Telr). Every method was tested end to end from the Sapil site. Before
launch Sapil needs its **own merchant accounts**, so its money, refunds,
disputes and reports stay separate.

| Provider | What to open | What to send the dev team (securely, not by email) | Webhook / callback address to register |
|---|---|---|---|
| **Stripe** | A Stripe account for Sapil (UAE), test + live | Secret key, publishable key, webhook signing secret (test and live) | `https://<api domain>/webhooks/payments/stripe` |
| **Tabby** | A Tabby merchant for Sapil (UAE) | Secret key, public key, merchant code, a long random webhook header value (test and live) | `https://<api domain>/webhooks/payments/tabby` |
| **Paymob** | A Paymob (UAE) account or integration for Sapil | Secret key, public key, API key, HMAC secret, card integration ID | `https://<api domain>/webhooks/payments/paymob` (sent automatically with each payment) |
| **Telr** | A Telr store for Sapil | Store ID, auth key, remote auth key, service API merchant ID + key | `https://<api domain>/webhooks/payments/telr` |
| Cash on delivery | Nothing to open | Confirm Sapil offers it, and any fee (see 4.2) | — |

Where the keys go: the backend credential packs, one per provider and brand
(`stripe-sapil`, `tabby-sapil`, `paymob-sapil`, `telr-sapil`, plus `-test`
variants), kept in the secret store, never in the code.

**Important — Telr is test-only today.** The Telr integration always creates
test transactions and its status check refuses a live account. Going live with
Telr needs development work (remove the test-only guard, verify on a live
test store). Stripe, Tabby and Paymob are ready for live keys.

Small follow-up: Telr's payment page asks the shopper for name, email and
phone again; the backend can pass them from checkout.

**Done when:** each provider pays a test order on the Sapil staging site and
the order shows Paid; then live keys are added at launch.

---

## 2. Email sending domain (owner: IT / whoever manages DNS and the email provider)

Today Sapil emails would be sent from the same sender as Swiss Arabian. For
delivery and trust, Sapil needs its own sending identity.

1. **Choose the addresses**, for example:
   - sender: `no-reply@<sapil domain>` (name "Sapil")
   - reply-to and support: `care@<sapil domain>` (a real, monitored inbox)
2. **Add the domain to the email provider** (the SMTP service in
   `EMAIL_SMTP_HOST`). The provider shows the exact records to add.
3. **Add DNS records** on the Sapil domain:

   | Record | Type | Purpose | Example |
   |---|---|---|---|
   | SPF | TXT on the domain | Says which servers may send for Sapil | `v=spf1 include:<provider's SPF host> ~all` (merge with any existing SPF; only one SPF record allowed) |
   | DKIM | TXT or CNAME (from the provider) | Signs every email | `<selector>._domainkey.<sapil domain>` → value from the provider |
   | DMARC | TXT on `_dmarc.<sapil domain>` | Tells inboxes what to do with fakes and sends reports | start with `v=DMARC1; p=none; rua=mailto:dmarc@<sapil domain>`, move to `p=quarantine` after 2–4 clean weeks |
   | Return-path / bounce (if the provider uses one) | CNAME | Bounce handling, SPF alignment | from the provider |

4. **Send the dev team:** sender address and name, reply-to, support email,
   the public Sapil website address. They go in `EMAIL_BRAND_SETTINGS.SAPIL`
   (`fromName`, `supportEmail`, `storefrontUrl`) and the sender settings.
5. **Logos for email:** host Sapil's email images on the CDN
   (`EMAIL_ASSETS_BASE_URL`), not the backend server.

**Done when:** a test email from staging to Gmail and Outlook shows
"SPF: PASS, DKIM: PASS, DMARC: PASS" in the message headers, and a
spam-score check (e.g. mail-tester.com) scores 9/10 or better.

---

## 3. Policy and contact details (owner: legal / Sapil brand owner)

Sapil's policies and contact pages were copied from Swiss Arabian's and
rebranded ("Swiss Arabian" → "Sapil"). The **group's details were kept** and
must be confirmed or replaced for Sapil:

| Detail | Where it appears on Sapil |
|---|---|
| Legal entity "Swiss Arabian Perfumes Co. LLC" | Terms of service |
| "Swiss Arabian Perfumes Group (SAPG)", Office 101 … P.O. Box 1615, Sharjah | Contact page (en, ar), Contact information policy, Privacy policy |
| Email `customerservice@sapguae.com` | Contact page (en, ar), Privacy page and policy (en, ar), Contact information policy, Shipping policy |
| Phone `+971 800 6177` / `800 6177` | Contact page (en, ar), Privacy page and policy, Contact information policy |
| WhatsApp / mobile `+971 54 583 4326` | Contact page (ar) |

Please confirm for each: keep as is (Sapil is sold by the same company and
served by the same support team), or give Sapil's own value. Changes are made
in the admin (Website pages and policies), no code needed.

Also for legal: the policies on `/policies/*` have **no Arabic text** (same as
Swiss Arabian); Arabic shoppers see English there. Decide whether Arabic
versions are needed for launch.

---

## 4. Product decisions (owner: product owner)

| # | Question | Options | Recommendation |
|---|---|---|---|
| 4.1 | **Was-price (crossed-out price) editing** — stored per market, no admin screen yet | a) admin screen per product and market; b) import from a spreadsheet; c) no was-prices at launch | **a** if Sapil runs sales from day one; otherwise **c** and add the screen after launch |
| 4.2 | **Cash-on-delivery fee** — design shows AED 10, the platform has no fee field | a) build a COD fee per market; b) no fee (as today) | **b** for launch (simpler, common in UAE); add **a** only if finance needs it |
| 4.3 | **Browsing by gender, mood or season** | a) curated collections (admin-managed); b) product attributes with filters | **a** for launch (works today, editable by the team); **b** later if the catalog grows |
| 4.4 | **Tile colour** — one colour per product for all markets | a) keep shared; b) per-market colour | **a** (same product, same colour everywhere) |
| 4.5 | **Curation** — Sapil's fragrance-notes and shoppable-video tiles | assign a content owner | Name an owner and fill them in the admin before launch |

Earlier defaults still in place (see `docs/multibrand/PROGRAM.md` → "Decisions
still open"): domains and first market, day-one scope, price-edit URLs, blog
URL, Arabic font, data owners. Please confirm or change them in the same pass.

---

## 5. Email rendering check in real mail apps (owner: QA / marketing ops)

Done locally: every email in both brands' colours, English and Arabic, and a
simulated "forced dark mode". Still to do on real apps before launch, with a
rendering service such as **Litmus** or **Email on Acid** (paid account owned
by the business), or by sending to real test inboxes.

**Mail apps** (light and dark mode each):

- Gmail web (Chrome), Gmail app (iPhone, Android)
- Outlook 365 (Windows desktop), Outlook.com (web), Outlook app (iPhone, Android), new Outlook for Windows
- Apple Mail (Mac), iPhone Mail
- Samsung Email (Android)

**Emails to check, for Sapil and Swiss Arabian, English and Arabic:**

| Group | Emails |
|---|---|
| Account | Welcome, verify email (code), sign-in code, reset password (code), password changed |
| Orders | Confirmed, shipped, delivered, cancelled |
| Returns | Requested, approved, rejected, received, refund pending, refund confirmed (and the other return steps) |
| Exchanges | Requested, approved, shipped, completed (and the other exchange steps) |
| Reviews | Review request, review reminder |
| Subscriptions (Swiss Arabian only) | Activated, renewal reminder, payment received / failed |

**For each, check:**

1. The logo is visible (light badge in dark mode) and sharp.
2. Colours are the brand's (Sapil navy and cream; Swiss Arabian copper and cream).
3. Arabic emails read right to left, with Arabic dates and brand name.
4. Buttons are visible and their text readable, in light and dark mode.
5. Every link opens the right page on the brand's site (privacy, terms,
   contact or stores, account, order, review stars, unsubscribe).
6. Nothing is cut off on a phone; no horizontal scrolling.
7. Images load (product images, icons); alt text shows if images are blocked.
8. The text-only version (shown by some apps) reads correctly.

Send any failures to the dev team with the app, mode and a screenshot.

---

## Status of testing (local)

| Flow | Sapil | Notes |
|---|---|---|
| Stripe card | Paid | Swiss Arabian test account |
| Paymob card + bank step + callback | Paid | through ngrok; Swiss Arabian test account |
| Tabby | Paid | Swiss Arabian test merchant |
| Telr | Paid | Swiss Arabian test store; Telr integration is test-only (see 1) |
| Cash on delivery | Delivered, paid | |
| Retry after a failed payment | Works | fixed during testing |
| Emails (account, order, review) | Received in Mailpit | language, brand colours, dark-mode safe logos |
| Review request → star link → review posted | Works | |
