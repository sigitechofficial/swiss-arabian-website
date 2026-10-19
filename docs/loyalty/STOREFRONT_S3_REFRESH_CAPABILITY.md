# Storefront S3 — Server-driven omnichannel refresh capability

`GET /storefront/loyalty/me` now owns whether store rewards can be refreshed. The browser does not infer that from LINKED / NOT_ENROLLED / UNAVAILABLE once `omnichannel.refresh` is present.

## Server capability

```ts
omnichannel.refresh: {
  enabled: boolean
  refreshable: boolean
  reason: "READY" | "COOLDOWN" | "NOT_READY" | "DISABLED"
  retryAfterSeconds: number | null
}
```

| reason | Control |
| --- | --- |
| `READY` (`enabled` + `refreshable`) | **Check for updates** enabled |
| `COOLDOWN` | Control shown, **disabled**. Honor `retryAfterSeconds` (no hardcoded 30/60 when the server sent a value). Cold load/reload uses this payload. |
| `NOT_READY` | No active refresh control. S1 Rewards stay. No identity internals. |
| `DISABLED` | Control hidden. No feature-flag copy. |

`POST /storefront/loyalty/omnichannel/refresh` is unchanged: `QUEUED` / `ALREADY_QUEUED` / `THROTTLED` / `NOT_READY` / `DISABLED`.

## POST race

`/me` can be stale at click time. The POST result wins immediately:

- `ALREADY_QUEUED` / `QUEUED` → S2 busy + bounded poll (2s / 5s / 10s)
- `THROTTLED` → disable using **POST** `retryAfterSeconds`
- Then the next `/me` capability replaces local eligibility

## After polling / reload

Each `/me` refetch replaces control state. Reload does not need prior React memory: COOLDOWN comes from the new payload.

## Fallback (older L5C)

If `omnichannel.refresh` is **omitted**, S2 heuristics remain: LINKED and NOT_ENROLLED show the control; ACTION_REQUIRED / UNAVAILABLE do not.

If `refresh` exists, **server values always win** — including LINKED + `DISABLED` (no button).

## Financial non-goals

Display-only D365 points. No cart/checkout redemption, no monetary conversion, no D365 tier mapping, no earn-preview substitution. Point quantities stay decimal strings.
