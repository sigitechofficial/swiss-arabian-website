# Storefront: journey pop-ups, consent banner, unsubscribe

Status: implemented and verified in dev (13 Nov 2026). The backend decides everything; the storefront only displays answers and reports what happened. Backend reference: `docs/analytics/JOURNEY_MESSAGING.md` in the backend repo.

## 1. What runs on every page

Mounted in `src/app/layout.tsx`:

| Component | File | Job |
|---|---|---|
| `JourneyEventsPoller` | `src/components/layout/JourneyEventsPoller.tsx` | Signed-in customers only. Every 60 s (`NEXT_PUBLIC_JOURNEY_POLL_MS`, min 2 s) pulls platform journey events and hands them to the Insider SDK, then acknowledges them. Unchanged by this work except that acks are now per channel on the backend. Off with `NEXT_PUBLIC_INSIDER_ENABLED=false`. |
| `OnsiteMessageHost` | `src/components/layout/OnsiteMessageHost.tsx` | Shows pop-ups and banners the backend decides on (section 2). |
| `ConsentBanner` | `src/components/layout/ConsentBanner.tsx` | Asks once whether we may measure shop usage (section 3). |

## 2. On-site pop-ups and banners (`OnsiteMessageHost`)

Flow per page:
1. `GET /storefront/onsite/triggers?path&locale&zoneCode&visitorId` returns the moments to watch (`dwell` seconds, `scroll` percent, `page_view`). Rules that cannot apply to this visitor are left out.
2. `watchOnsiteTriggers` (`src/features/onsite/lib/watchTriggers.ts`) times them: dwell counts visible seconds only; `page_view` fires immediately.
3. When one fires, `POST /storefront/onsite/decide` returns one message or `null`.
4. The host shows it (`OnsiteMessageView`: popup z-220, banner z-210) and posts `SHOWN`, later `CLICKED` / `DISMISSED` to `/storefront/onsite/events`.

**Journey pop-ups** (for example "You left 2 items in your cart") need no storefront code of their own. For a signed-in customer the backend answers the `page_view` hint when a journey step is due and returns the finished text (name, item count and product already filled in). The browser cannot claim a journey step: only the backend's own rechecked events count. The request carries the customer's access token (`apiClient` adds `Authorization`), so a signed-out visitor never sees a journey pop-up.

Guardrails (all enforced by the backend): never on checkout, payment, account or sign-in pages; one message per session; frequency caps; cooldown after dismiss; stable hold-back group. Failures are silent: on-site messages never disturb the page. Disable all with `NEXT_PUBLIC_ONSITE_ENABLED=false`.

Content is managed in the admin ("On-site messages", trigger "journey step"). Link buttons use paths like `/cart`, which the locale link layer prefixes.

## 3. Consent banner (`ConsentBanner`)

- Shown once, only when `NEXT_PUBLIC_TRACKING_ENABLED=true` and the shopper has not chosen. English and Arabic, link to `/privacy-policy`, z-230 (above the pop-up).
- Accept stores `granted`, Decline stores `denied` under `sa_tracking_consent` in `localStorage`; the tracker (`src/lib/analytics/tracker.ts`) reads it: **Decline stops every first-party event from being queued or sent.**
- Implementation uses `useSyncExternalStore` with a hidden server snapshot so server and first client render match.
- Not covered: the Insider script is not gated by this choice, and the choice is not saved on the customer record. Copy keys: `consent*` in `src/lib/i18n/shopCopy.ts`.

## 4. Unsubscribe page

Route `src/app/(shop)/unsubscribe/page.tsx` (noindex) renders `src/features/journeys/components/UnsubscribeView.tsx`. It is opened from the link in every journey email: `/<locale>/unsubscribe?token=<customerId>.<signature>`.

- The page does nothing on load. The customer presses **Unsubscribe**, then the page posts `POST /storefront/email-preferences/unsubscribe { token }`. (A button, not the page load, so mail scanners that prefetch links cannot unsubscribe anyone.)
- Results: confirmation (`role="status"`), or an invalid/expired message (`role="alert"`), also when there is no token or the request fails.
- No sign-in needed; the signed token is the credential. The backend sets the customer's email consent to opted out, which the email sender checks before every email.
- Copy keys: `unsubscribe*` (English and Arabic) in `shopCopy.ts`.

## 5. Files added or changed

| Path | Change |
|---|---|
| `src/components/layout/ConsentBanner.tsx` (+ `.spec.tsx`) | new |
| `src/features/journeys/components/UnsubscribeView.tsx` (+ `.spec.tsx`) | new |
| `src/app/(shop)/unsubscribe/page.tsx` | new |
| `src/app/layout.tsx` | renders `ConsentBanner` |
| `src/features/journeys/types.ts` | entity type `customer_cycle` |
| `src/lib/i18n/shopCopy.ts` | consent and unsubscribe copy (EN, AR) |

Earlier on-site and journey files (`OnsiteMessageHost`, `OnsiteMessageView`, `features/onsite/*`, `features/journeys/*`, `JourneyEventsPoller`) are documented in the backend plan and in `INSIDER_*` docs here.

## 6. Environment

| Variable | Default | Effect |
|---|---|---|
| `NEXT_PUBLIC_ONSITE_ENABLED` | on | `false` disables pop-ups and banners |
| `NEXT_PUBLIC_TRACKING_ENABLED` | off | `true` enables the tracker and shows the consent banner |
| `NEXT_PUBLIC_INSIDER_ENABLED` | on | `false` disables Insider and the journey poller |
| `NEXT_PUBLIC_JOURNEY_POLL_MS` | 60000 | poll interval for testing (min 2000) |

## 7. Tests

`src/components/layout/ConsentBanner.spec.tsx` (7), `src/features/journeys/components/UnsubscribeView.spec.tsx` (4), `src/features/journeys/lib/deliverJourneyEvents.spec.ts`, `src/features/onsite/**/*.spec.*`. Vitest 4 needs Node 22:

```
npx -y node@22 node_modules/vitest/vitest.mjs run src/features/journeys src/features/onsite src/components/layout/ConsentBanner.spec.tsx --maxWorkers=1 --fileParallelism=false
```

## 8. Manual check

1. Sign in as a customer with an active cart and a due `cart_abandonment_eligible` event, and with an active on-site rule on that step.
2. Open any normal page (not checkout or account): the pop-up appears with the customer's name and cart details.
3. Close it and reload: it does not return.
4. Open an email's unsubscribe link: the page shows a button; pressing it shows the confirmation.
