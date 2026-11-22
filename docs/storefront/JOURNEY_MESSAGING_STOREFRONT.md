# Storefront: journey pop-ups, consent banner, unsubscribe

Status: implemented and verified in dev (13 Nov 2026). The backend decides everything; the storefront only displays answers and reports what happened. Backend reference: `docs/analytics/JOURNEY_MESSAGING.md` in the backend repo.

## 1. What runs on every page

Mounted in `src/app/layout.tsx`:

| Component | File | Job |
|---|---|---|
| `JourneyEventsPoller` | `src/components/layout/JourneyEventsPoller.tsx` | Signed-in customers only. Every 60 s (`NEXT_PUBLIC_JOURNEY_POLL_MS`, min 2 s) pulls platform journey events and hands them to the Insider SDK, then acknowledges them. Unchanged by this work except that acks are now per channel on the backend. Off with `NEXT_PUBLIC_INSIDER_ENABLED=false`. |
| `OnsiteMessageHost` | `src/components/layout/OnsiteMessageHost.tsx` | Shows pop-ups and banners the backend decides on (section 2). |
| `ConsentBanner` | `src/components/layout/ConsentBanner.tsx` | Cookie banner: Accept all, Reject all, Manage choices (section 3). |

## 2. On-site pop-ups and banners (`OnsiteMessageHost`)

Flow per page:
1. `GET /storefront/onsite/triggers?path&locale&zoneCode&visitorId` returns the moments to watch (`dwell` seconds, `scroll` percent, `page_view`). Rules that cannot apply to this visitor are left out.
2. `watchOnsiteTriggers` (`src/features/onsite/lib/watchTriggers.ts`) times them: dwell counts visible seconds only; `page_view` fires immediately.
3. When one fires, `POST /storefront/onsite/decide` returns one message or `null`.
4. The host shows it (`OnsiteMessageView`: popup z-220, banner z-210) and posts `SHOWN`, later `CLICKED` / `DISMISSED` to `/storefront/onsite/events`.

**Journey pop-ups** (for example "You left 2 items in your cart") need no storefront code of their own. For a signed-in customer the backend answers the `page_view` hint when a journey step is due and returns the finished text (name, item count and product already filled in). The browser cannot claim a journey step: only the backend's own rechecked events count. The request carries the customer's access token (`apiClient` adds `Authorization`), so a signed-out visitor never sees a journey pop-up.

Guardrails (all enforced by the backend): never on checkout, payment, account or sign-in pages; one message per session; frequency caps; cooldown after dismiss; stable hold-back group. Failures are silent: on-site messages never disturb the page. Switch them on or off per brand + market in the admin (Settings → Integrations → "On-site messages"; settings phase 11 — was `NEXT_PUBLIC_ONSITE_ENABLED`).

Content is managed in the admin ("On-site messages", trigger "journey step"). Link buttons use paths like `/cart`, which the locale link layer prefixes.

## 3. Cookie banner (`ConsentBanner`)

Rebuilt 14 Nov 2026 (branch `feat/cookie-consent`) as the cookie banner shoppers know from other shops. Store: `src/lib/consent/consent.ts`; React hook: `src/lib/consent/useConsent.ts`.

**What the shopper sees.** A bar at the bottom (z-230, above pop-ups) with **Accept all** and **Reject all** at equal weight, and **Manage choices**, which shows one switch per category. **Cookie settings** in the footer (Swiss Arabian `SiteFooter`, Sapil `SapilFooter`; `CookieSettingsLink`) opens the choices again at any time. English and Arabic; links to the brand's privacy page.

**Categories.**

| Category | Controls | Without consent |
|---|---|---|
| Necessary | cart, sign-in, language, market | always on, not asked |
| Analytics | first-party tracker (`tracker.ts`), Google Tag Manager / GA4 (`AnalyticsScripts`) | nothing queued or sent; no visitor or session id stored (an in-memory id per page is used instead) |
| Marketing | Insider (head script, `lib/insider.ts`, `InsiderScripts`, `JourneyEventsPoller`), on-site pop-ups and banners (`OnsiteMessageHost`) | `ins.js` not loaded, nothing queued for Insider, no `sa_insider_uuid` / `sa_insider_user`; no pop-ups |

Only categories this deployment uses are offered (`consentCategoriesInUse`: tracker flag or a GTM / GA4 id for analytics; Insider account or on-site messages for marketing). No banner at all when nothing optional is on.

**How each part follows the choice.**
- The choice is JSON under `sa_cookie_consent` (`{ analytics, marketing, version, decidedAt }`). `CONSENT_VERSION` asks again when categories change. The old `sa_tracking_consent` answer covered measurement only, so those shoppers are asked once more; it is removed on the new choice.
- Insider: the `<head>` script now defines `window.__saInsiderBoot` (append `ins.js`, then the same context / page type / init as before) and runs it only when marketing consent is already stored. When a shopper accepts on the page, `InsiderScripts` calls `activateInsiderAfterConsent()`, which empties the queue first so nothing from before the choice is sent. `gdpr_optin: true` is therefore only ever sent after consent.
- Google: GTM / GA4 load only with analytics consent. Google consent mode v2 is set before the tag (`analytics_storage` granted; `ad_storage`, `ad_user_data`, `ad_personalization` follow marketing) and updated on change, so advertising tags inside GTM respect the marketing choice.
- Turning a category off after it ran removes its stored ids and reloads the page, because loaded scripts cannot be unloaded.

**Decisions to confirm with the business.**
- Pop-ups count as marketing because they need a stored visitor id for their frequency limits. If plain announcement banners should show to everyone, they need a cap that works on the session alone.
- The choice lives in the browser only. It is not stored on the customer record, so a signed-in customer on a second device is asked again.
- The privacy policy page should list these categories and tools.

Tests: `ConsentBanner.spec.tsx` (accept, reject, manage, categories in use, reopen from footer, reload on withdrawal, Arabic), `tracker.spec.ts`, `insider.spec.ts`, `insiderCustomEvent.spec.ts`.

## 4. Unsubscribe page

Route `src/app/[site]/[locale]/(shop)/unsubscribe/page.tsx` (noindex) renders `src/features/journeys/components/UnsubscribeView.tsx`. It is opened from the link in every journey email: `/<locale>/unsubscribe?token=<customerId>.<signature>`.

- The page does nothing on load. The customer presses **Unsubscribe**, then the page posts `POST /storefront/email-preferences/unsubscribe { token }`. (A button, not the page load, so mail scanners that prefetch links cannot unsubscribe anyone.)
- Results: confirmation (`role="status"`), or an invalid/expired message (`role="alert"`), also when there is no token or the request fails.
- No sign-in needed; the signed token is the credential. The backend sets the customer's email consent to opted out, which the email sender checks before every email.
- Copy keys: `unsubscribe*` (English and Arabic) in `shopCopy.ts`.

## 4b. Tracked email button page (`/r`)

Route `src/app/[site]/[locale]/(shop)/r/page.tsx` (noindex) renders `src/features/journeys/components/EmailLinkRedirect.tsx`. The main button of a journey email links to `/<locale>/r?t=<token>`.

- On load the page (in the browser, so a mail scanner that only fetches the address does nothing) posts `POST /storefront/email-links/open { token }`. The backend records the click and answers with a destination path.
- The page forwards with `router.replace`, adding the reader's language (`/ar/r` goes to `/ar/cart`). It only forwards to a path on this site (starts with `/`, not `//`, no backslash), a second lock after the backend's check.
- It never signs anyone in. A customer who is signed out lands on the destination page, which asks for a sign-in itself.
- An invalid, expired or missing token, or a failed request, shows a short message and a link to the shop. Copy keys: `emailLinkOpening`, `emailLinkFailed`, `emailLinkHome` in `src/messages/en.json` and `ar.json`.
- Tests: `EmailLinkRedirect.spec.tsx` (forwards, Arabic prefix, single request, invalid link, off-site destinations refused, request failure, no token).

## 5. Files added or changed

| Path | Change |
|---|---|
| `src/components/layout/ConsentBanner.tsx` (+ `.spec.tsx`) | new |
| `src/features/journeys/components/UnsubscribeView.tsx` (+ `.spec.tsx`) | new |
| `src/app/[site]/[locale]/(shop)/unsubscribe/page.tsx` | new |
| `src/features/journeys/components/EmailLinkRedirect.tsx` (+ `.spec.tsx`), `src/app/[site]/[locale]/(shop)/r/page.tsx` | new (tracked email button) |
| `src/app/layout.tsx` | renders `ConsentBanner` |
| `src/features/journeys/types.ts` | entity type `customer_cycle` |
| `src/lib/i18n/shopCopy.ts` | consent and unsubscribe copy (EN, AR) |

Earlier on-site and journey files (`OnsiteMessageHost`, `OnsiteMessageView`, `features/onsite/*`, `features/journeys/*`, `JourneyEventsPoller`) are documented in the backend plan and in `INSIDER_*` docs here.

## 6. Environment

| Variable | Default | Effect |
|---|---|---|
| ~~`NEXT_PUBLIC_ONSITE_ENABLED`~~ | retired | Admin switchboard "On-site messages" per brand + market (off when the backend cannot say) |
| ~~`NEXT_PUBLIC_TRACKING_ENABLED`~~ | retired | Admin switchboard "First-party tracking" per brand + market (off when the backend cannot say) |
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
