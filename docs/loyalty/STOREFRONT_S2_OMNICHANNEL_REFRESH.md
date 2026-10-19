# Storefront S2 — Omnichannel Rewards refresh

Authenticated customers can request a **real async D365 read refresh**. This is not redemption, earn, checkout sync, or financial posting.

## Endpoint

`POST /storefront/loyalty/omnichannel/refresh`

- Market query only (`zoneCode`, `currencyCode`, …) — same as other storefront Loyalty reads.
- **No body** with `phone`, `cardNumber`, `customerId`, `mappingId`, or `customerAccount`. Identity is the session.
- Website redemption remains disabled (`omnichannel.websiteRedemption.enabled = false`).

Statuses:

| Status | UI |
| --- | --- |
| `QUEUED` | “Refreshing…” then bounded `/me` (+ transactions) refetch |
| `ALREADY_QUEUED` | Same as queued — not an error |
| `THROTTLED` | “You can refresh again shortly.” Honor `retryAfterSeconds` |
| `NOT_READY` | “Store rewards can’t be refreshed right now.” |
| `DISABLED` | Keep S1 card; do not poll |

Optional `refreshRequestedAt`, `retryAfterSeconds`. HTTP 429 maps to `THROTTLED`.

## When the control shows

Default (no explicit capability):

- **LINKED** / **NOT_ENROLLED** (including stale LINKED): show “Check for updates”
- **ACTION_REQUIRED** / **UNAVAILABLE**: hide

If the server sends `refresh.enabled` or `refreshable`, that boolean wins (so UNAVAILABLE can expose a refresh path).

## Polling

After `QUEUED` / `ALREADY_QUEUED`, refetch:

1. `GET /storefront/loyalty/me`
2. `GET /storefront/loyalty/transactions` when store activity is loaded

At approximately **2s, 5s, 10s**. Stop at 10s. Do not poll BullMQ or poll forever.

## Success

Snapshot before POST: `fetchedAt`, `lastSuccessfulSyncAt`, `lastTransactionImportSuccessAt`, status, `activePoints` string.

Complete when a timestamp advances, status changes, or `activePoints` string changes. **Unchanged balance + newer timestamp still counts.** Do not treat an unchanged balance as failure.

No optimistic rewrite of D365 point strings while pending.

## Activity

On each poll tick (and thus on completion), store activity is refetched independently of Platform extras. Online pagination is not rebuilt from D365 rows.

## Financial non-goals

- No D365 cart/checkout redemption
- No D365 monetary conversion
- No earn-preview or Platform max-redeemable changes
