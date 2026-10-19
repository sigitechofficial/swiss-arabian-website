# Storefront S1 — Omnichannel Rewards (read UI)

Display-only D365 Loyalty on the authenticated Rewards account. Website redemption from D365 is not implemented.

## API contract

- `GET /storefront/loyalty/me` — existing Platform Loyalty plus additive `omnichannel`.
- `GET /storefront/loyalty/transactions` — `items` / `platformActivity` (Platform ledger) plus `externalActivity` (D365 import), with `externalPageInfo`, `lastTransactionImportSuccessAt`, `activityIsFresh`.
- There is no `POST /storefront/loyalty/refresh`. The UI does not offer a fake D365 refresh.

`omnichannel.websiteRedemption.enabled` is always `false`.

## Balance semantics

| Field | Meaning |
| --- | --- |
| `wallet.availablePoints` | Platform website wallet. Used for cart/checkout redemption. |
| `omnichannel.balance.activePoints` | D365 store balance. **Display only.** Never max-redeemable, never amount payable. |

Do not multiply `activePoints` by point value or any hardcoded rate. Backend has not exposed a D365 monetary equivalent.

## UI states (`omnichannel.status`)

- **LINKED** + `balance` — show active points. Zero (`"0"`) is an enrolled member with no points, not “not enrolled”.
- **LINKED** + `sync.isFresh === false` — still show last-known-good balance, with a delayed-sync note.
- **NOT_ENROLLED** — membership copy only; no `0 points`; no enrollment CTA.
- **UNAVAILABLE** — quiet degraded store card; Platform wallet/tier stay usable.
- **ACTION_REQUIRED** — safe linking copy + existing `/faq#contact`. No identity/currency mismatch internals.

Copy never names D365, F&O, HTTP status, or ERP entities.

## Activity separation

Platform and D365 rows are not merged. Rewards shows **Online activity** and **Store activity**. Pagination uses `pageInfo` for Platform and `externalPageInfo` for D365, with independent offsets. Internal fields (`operatorId`, card numbers, mapping ids, terminals as store names) are not rendered.

`category` is `EARN` | `REDEEM` | `OTHER`. `OTHER` is never labeled Earn (including `ReturnEarned`). Origin is taken from the backend (`STORE` / `UNKNOWN`), not inferred from receipt ids.

If `activityIsFresh` is false, store activity shows a delayed-sync note. Transaction import is not live/realtime.

If the transactions request fails, `/me` (including Platform wallet and omnichannel status) still renders.

## Decimal strings

D365 point quantities are decimal **strings** (`"95.24"`, `"20.5"`, `"0"`). Display uses a string-safe formatter. The browser does not use `parseFloat` / `Number` / `Math.round` for D365 point arithmetic.

Platform wallet/redemption still follows the existing cart quote contract (server-priced). L7.1 compatibility is display/read only for omnichannel strings.

## Redemption and checkout

- No “Use store points” / D365 redeem CTA.
- Cart `PUT /storefront/cart/:id/loyalty-redemption` still sends `{ points }` from the Platform quote only.
- PDP / cart / checkout earn preview and Platform tier UI are unchanged. D365 `LoyaltyTierId` is not mapped.

## Privacy

Customer group, card numbers, operator ids, party numbers, and ERP keys are not shown.
