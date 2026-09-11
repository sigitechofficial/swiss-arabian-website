# Account & Auth UI → API map

Maps the Figma account/auth screens now built in the storefront to the
storefront API. "Live" means the endpoint is documented in
`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md` **and** wired in code.
Everything else renders real UI with placeholder content and an honest
"available soon" toast — no fake success states.

## 1. Auth flow — Figma 731:6018

| Screen | Route | Endpoint | State |
| --- | --- | --- | --- |
| Sign in | `/login` | `POST /storefront/auth/login` | Live |
| Create account | `/register` | `POST /storefront/auth/register` | Live |
| Verify your number | `/verify` | `POST /storefront/auth/verify-phone/request` · `/confirm` · `POST /storefront/auth/otp/resend` | Live, flag-gated |
| Forgot / reset password | `/forgot-password`, `/reset-password` | `POST /storefront/auth/forgot-password` · `/reset-password` | Live |

### OTP / phone verification

The OTP screen exists in code but is **off by default**:

- Frontend gate: `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI` → `env.flags.verification`
- Backend gate: `CUSTOMER_VERIFICATION_ENABLED`

Behaviour with the flag **off** (current state):

- `/register` completes straight to `/account`; it never routes to `/verify`.
- The mobile-number helper text reads "Include country code (e.g. +971)."
  instead of the Figma copy "We'll send a verification code.", so the UI does
  not promise an SMS that is not sent.
- Visiting `/verify` directly shows "Verification is turned off for this
  environment." plus a link back to the account.

Turning the flag on restores the Figma copy and the register → verify → account
journey with no further code changes.

## 2. Account Dashboard — Figma 1068:2 + 1098:9661

Route `/account`.

| Block | Data source | State |
| --- | --- | --- |
| Greeting "Hi {firstName}!" | `GET /storefront/customer/me` via `useCurrentUser()` | Live |
| Subscription panel → `/account/subscription` | none (static copy) | UI only |
| Recent purchase card | Orders API | Pending (Phase 6) |
| Profile highlight cards (address / payment / help) | Addresses + payments APIs | Pending (Phase 2 / 5) |
| Account + Support card grids | static navigation | UI only |
| Sign out | `POST /storefront/auth/logout` via `performLogout()` | Live |

Both Figma dashboard frames are represented on this one route: the hero,
recent purchase and profile cards come from `1068:2`; the "MY ACCOUNT /
Account Dashboard" card grid, "SUPPORT / Need Help?" heading, help row and
support cards come from `1098:9661`. The `1098` welcome banner is intentionally
dropped because the `1068` hero greeting already occupies that slot — keeping
both would stack two greetings.

## 3. Purchase History — Figma 1205:9002

Route `/account/orders`.

| Need | Endpoint | State |
| --- | --- | --- |
| Active + past orders, channel filter (All / Online / In Store) | `GET /storefront/orders` (list) | Pending (Phase 6) |
| "View Details" → `/account/orders/{id}` | `GET /storefront/orders/{id}` | Pending (Phase 6) |

`OrderSummaryView` in `src/features/orders/types/order.ts` is the mapper target —
the API only needs a transform into that shape, not a UI change.

## 4. Profile — Figma 1230:9413

Route `/account/profile`.

| Row | Endpoint | State |
| --- | --- | --- |
| Name, Email (display) | `GET /storefront/customer/me` | Live |
| Name / Email edit | `PATCH /storefront/customer/me` | Pending (Phase 2) |
| Password → `/account/security` | `POST /storefront/customer/change-password` | Live |
| Passkeys | not planned yet | Pending |
| Shipping addresses | customer addresses API | Pending (Phase 2) |
| Payment methods → `/account/payments` | payments API | Pending (Phase 5) |
| Communication preferences | marketing consents API | Pending (Phase 2) |
| Delete account | not planned yet | Pending |

## 5. My Subscription — Figma 1236:9875

Route `/account/subscription`.

| Block | Endpoint | State |
| --- | --- | --- |
| Status card (plan, billing, next billing, address, deliveries) | subscriptions API | Pending |
| Next delivery + "Swap this scent" | subscriptions API | Pending |
| Progress + Skip / Pause / Cancel | subscriptions API | Pending |
| 12-month delivery & purchase history | subscriptions API | Pending |

Reference data lives in `src/features/subscriptions/data/mySubscriptionContent.ts`.

## 6. Payments — Figma 1318:10242

Route `/account/payments`.

| Block | Endpoint | State |
| --- | --- | --- |
| Saved cards (default / edit / remove / add) | payment methods API | Pending (Phase 5) |
| Transaction history + All / Payments / Upcoming / Refunds filter | transactions API | Pending (Phase 5) |
| Download statement | statements API | Pending |

Only masked card data (brand + last 4 + expiry) is modelled; the storefront
never handles full card numbers.

## 7. Navigation

`accountTabNav` keeps the Figma tab labels exactly: Dashboard, Purchase
History, Profile, Membership Benefits, Wishlist, Saved Items. My Subscription
and Payments are not tabs in the design — they are reached from the dashboard
subscription panel, the dashboard quick-link cards and the profile page.
