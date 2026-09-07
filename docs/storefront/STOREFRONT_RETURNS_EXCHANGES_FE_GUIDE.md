# Swiss Arabian — Storefront Returns & Exchanges Frontend Integration Guide

> **Audience:** Customer storefront frontend + Cursor/AI agent.  
> **Purpose:** Wire **return and exchange requests** against existing Nest APIs.  
> **Source of truth:** running backend + Swagger at `/api/docs`. Never invent fields.  
> **Prerequisite:** Account orders + guest tracking live (`STOREFRONT_ORDER_DETAIL_TRACKING_FE_GUIDE.md`). Reviews are done — do not redo them.  
> **Short handoff:** [`STOREFRONT_RETURNS_EXCHANGES_FE_HANDOFF.md`](./STOREFRONT_RETURNS_EXCHANGES_FE_HANDOFF.md)  
> **FE status as of 2026-09-07:** after-sales APIs are **not** called. This phase is **API wiring**. Start from `/account/orders/[id]` and `/track/[orderNumber]`.

---

## 0. Golden rules

1. Unwrap the global envelope — business payload is `data`.
2. No `/api/v1` prefix.
3. Logged-in: **JWT only**. Never send `customerId`. Wrong order/request → **404**.
4. Guest: `orderNumber` + **`orderAccessToken`** (same `sa_order_access_token` as tracking). `orderNumber` alone is never enough. Prefer `orderAccessToken` / `trackingToken`; `guestToken` is legacy only.
5. JWT create uses **`orderId` (UUID)** from `GET /storefront/customer/orders/:orderId`. Guest create uses **`orderNumber`**.
6. Items must use **`orderLineId`** from that order’s lines. Quantity must be ≤ remaining eligible qty.
7. Create = **request only**. Status starts **`REQUESTED`**. Backend does **not** refund, create a label, reserve stock, create a replacement order, or call D365.
8. UX copy: “Return request submitted.” **Never** “Refunded” / “Exchange shipped.”
9. Order must be shipped/delivered (not draft / checkout / cancelled / failed). Else **422**.
10. Never invent fields — Swagger tag **Storefront Returns & Exchanges**.

**Stop rule:** Do not wire support, reviews, wishlist, coupons, or checkout address in this PR.

---

## 1. Environment

| Flow | Auth |
|------|------|
| `/storefront/customer/returns*` `/exchanges*` `/orders/:orderId/returns` `/orders/:orderId/exchanges` | Strict JWT |
| `/storefront/returns/order/:orderNumber` `/storefront/exchanges/order/:orderNumber` | Proof: `orderAccessToken` (query or body) and/or JWT if `order.customerId` matches |

HTTP create is **200**.

---

## 2. Logged-in returns

### 2.1 List

```http
GET /storefront/customer/returns?limit=20&offset=0
```

Optional: `status`, `orderId` (UUID).

**Success `data`:** `{ items, total, limit, offset }`

```ts
interface StorefrontReturnSummaryView {
  returnRequestId: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string | null;
  status: string;              // starts REQUESTED
  reasonCode: string;
  reasonText: string | null;
  requestedResolution: string; // default REFUND
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  latestStatusMessage: string;
}
```

### 2.2 Detail

```http
GET /storefront/customer/returns/:returnRequestId
```

Adds `customerNote`, `items[]`, `order { orderId, orderNumber, status, fulfillmentStatus }`.

```ts
interface StorefrontReturnItemView {
  itemId: string;
  orderLineId: string | null;
  sku: string;
  productName: string | null;
  variantName: string | null;
  requestedQty: number;
  reasonCode: string;
  reasonText: string | null;
}
```

### 2.3 Create

```http
POST /storefront/customer/orders/:orderId/returns
```

```json
{
  "items": [
    {
      "orderLineId": "uuid-from-order-line",
      "quantity": 1,
      "reasonCode": "CUSTOMER_CHANGED_MIND"
    }
  ],
  "reasonCode": "CUSTOMER_CHANGED_MIND",
  "reasonText": "Opened by mistake",
  "customerNote": "Please collect from the same address",
  "requestedResolution": "REFUND"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `items` | Yes | 1–20. Unique `orderLineId` each |
| `items[].orderLineId` | Yes | UUID from the **same** order |
| `items[].quantity` | Yes | Integer 1–999; ≤ remaining qty |
| `reasonCode` | No | Default `OTHER` |
| `requestedResolution` | No | Default `REFUND` |

**ReturnReasonCode:**  
`DAMAGED_ITEM` · `WRONG_ITEM` · `DEFECTIVE_ITEM` · `SIZE_OR_VARIANT_ISSUE` · `NOT_AS_DESCRIBED` · `CUSTOMER_CHANGED_MIND` · `LATE_DELIVERY` · `DUPLICATE_ORDER` · `ALLERGY_OR_SAFETY_CONCERN` · `OTHER`

**ReturnResolutionType (request only):**  
`REFUND` · `EXCHANGE` · `STORE_CREDIT` · `OTHER`  
(`REJECTED` / `REPAIR` / `MANUAL_REVIEW` are ops — do not offer as customer default)

Success `data` = detail view, `status: "REQUESTED"`.

---

## 3. Logged-in exchanges

```http
GET  /storefront/customer/exchanges?limit=20&offset=0
GET  /storefront/customer/exchanges/:exchangeRequestId
POST /storefront/customer/orders/:orderId/exchanges
```

```json
{
  "items": [
    {
      "orderLineId": "uuid-from-order-line",
      "quantity": 1,
      "replacementSku": "CASA104301",
      "replacementSize": "100ml",
      "reasonCode": "WRONG_VARIANT"
    }
  ],
  "reasonCode": "WRONG_VARIANT",
  "exchangeType": "SIZE_OR_COLOR_CHANGE",
  "customerNote": "Please send 100ml instead of 50ml"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `items[].orderLineId` | Yes | |
| `items[].quantity` | Yes | ≤ remaining qty |
| `items[].replacementSku` | Yes | Intent only. Same SKU OK for same-item |
| `replacementVariantId` / size / color | No | Stored as intent — no inventory hold |

**ExchangeReasonCode:**  
`WRONG_ITEM` · `WRONG_VARIANT` · `DAMAGED_ITEM` · `DEFECTIVE_ITEM` · `CUSTOMER_PREFERENCE` · `ADMIN_DECISION` · `OTHER`

**ExchangeType:**  
`SAME_ITEM` · `DIFFERENT_VARIANT` · `DIFFERENT_PRODUCT` · `SIZE_OR_COLOR_CHANGE` · `OTHER`  
(Avoid `PRICE_ADJUSTMENT` / `GOODWILL` on customer UI)

Create does **not** place a new order or charge a difference.

---

## 4. Guest (same proof as tracking)

Use `sa_order_access_token` from place-order. User can paste it on `/track/[orderNumber]`.

```http
GET  /storefront/returns/order/:orderNumber?orderAccessToken=
POST /storefront/returns/order/:orderNumber
GET  /storefront/exchanges/order/:orderNumber?orderAccessToken=
POST /storefront/exchanges/order/:orderNumber
```

POST body = same items/reasons as logged-in, **plus** proof:

```json
{
  "orderAccessToken": "…",
  "items": [{ "orderLineId": "…", "quantity": 1 }]
}
```

Wrong/missing proof → **404** (do not leak that the order exists).  
Guest list is that **order only** (not a full account history).

If the customer is logged in and owns the order, Bearer alone is enough (optional JWT guard).

---

## 5. Eligibility (show/hide the button)

Show “Request return / exchange” only when the order looks shipped or delivered.

| Blocked (422) | Typically eligible |
|---------------|-------------------|
| `DRAFT` `CHECKOUT_STARTED` `CANCELLED` `FAILED` | `SHIPMENT_CREATED` `IN_TRANSIT` `DELIVERED` `PARTIALLY_SHIPPED` |

Also 422 if:

- line does not belong to the order  
- duplicate `orderLineId` in one payload  
- qty &gt; remaining (purchased − cancelled − already requested)  
- no positive remaining qty  

There is **no** day-window / hygiene SKU policy on storefront yet (backend TODO). Do not invent “14-day window” in FE unless product gives copy-only text.

---

## 6. Status display (read-only)

Customer **cannot** PATCH status. Poll list/detail after submit.

**Return (common):** `REQUESTED` → `PENDING_REVIEW` → `APPROVED` / `REJECTED` → later refund/ship states.  
**Exchange (common):** `REQUESTED` → `PENDING_REVIEW` → `APPROVED` / `REJECTED`.

Use `latestStatusMessage` + `status` as the badge. Map unknown statuses to a generic “In progress” — do not invent a second lifecycle.

---

## 7. Suggested FE flows

### A — Account order detail (primary)

```
GET /storefront/customer/orders/:orderId
  → lines have orderLineId
If eligible → form
POST /storefront/customer/orders/:orderId/returns  (or /exchanges)
  → toast “Request submitted”
  → GET /storefront/customer/returns/:id
```

### B — Account list

```
GET /storefront/customer/returns
GET /storefront/customer/exchanges
```

Add `/account/returns` if no page exists, or a tab on `/account/orders`.

### C — Guest track page

```
Existing /track/:orderNumber + orderAccessToken
  → GET /storefront/returns/order/:orderNumber?orderAccessToken=
  → POST with same token + items
```

---

## 8. Errors

| HTTP | When | UX |
|------|------|-----|
| `400` | Validation | Field errors |
| `401` | JWT missing on customer routes | Login |
| `404` | Wrong ownership / bad guest proof | “Not found” — no existence leak |
| `422` | Not eligible / bad qty / bad line | Show `message` |

---

## 9. Suggested API module

```ts
afterSalesApi.listReturns(query)
afterSalesApi.getReturn(returnRequestId)
afterSalesApi.createReturn(orderId, dto)
afterSalesApi.listExchanges(query)
afterSalesApi.getExchange(exchangeRequestId)
afterSalesApi.createExchange(orderId, dto)
afterSalesApi.listGuestReturns(orderNumber, proof)
afterSalesApi.createGuestReturn(orderNumber, dto + proof)
afterSalesApi.listGuestExchanges(orderNumber, proof)
afterSalesApi.createGuestExchange(orderNumber, dto + proof)
```

Reuse Phase 1 client. Guest proof param name: `orderAccessToken` (same as tracking).

---

## 10. Acceptance checklist

- [ ] Order detail can open a return form using **order line UUIDs**
- [ ] Create return → `REQUESTED`; toast is **request**, not refund
- [ ] Ineligible order (unpaid/cancelled) → 422, button hidden or disabled
- [ ] Qty over remaining → 422
- [ ] Other customer’s `orderId` / request id → 404
- [ ] Exchange requires `replacementSku`; no new order appears in `/customer/orders`
- [ ] Guest needs `orderAccessToken`; bare orderNumber fails
- [ ] Guest list only that order
- [ ] No support / reviews / coupon work in this PR

---

## 11. Explicitly not this phase

| Topic | Why |
|-------|-----|
| Automatic refund / Paymob refund | Platform-wide; not this API |
| Shipping label / pickup | Not implemented |
| Replacement checkout | Exchange is intent only |
| Support tickets | Next module |
| Preferences / `customerAddressId` | Tiny leftover PRs — separate |

---

## 12. Agent prompt (paste into Cursor)

```
You are wiring Swiss Arabian storefront returns and exchanges against the NestJS backend.
Read docs/storefront/STOREFRONT_RETURNS_EXCHANGES_FE_GUIDE.md
Reuse Phase 1 apiClient (envelope unwrap, Bearer, refresh).
JWT: GET/POST /storefront/customer/returns* and /exchanges* and POST /storefront/customer/orders/:orderId/returns|exchanges
Guest: /storefront/returns/order/:orderNumber and /exchanges/order/:orderNumber with orderAccessToken (same as tracking).
Create = REQUESTED only. Do not claim refunded or exchanged.
orderLineId + quantity from the order. No /api/v1. Never invent fields.
Swagger: Storefront Returns & Exchanges.
Do not wire support, reviews, wishlist, or coupons in this PR.
```
