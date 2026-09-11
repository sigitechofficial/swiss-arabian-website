# Storefront checkout billing address — FE handoff (short)

**Theme:** Persist a **BILLING** address on checkout orders (in addition to shipping/delivery).  
**Guide:** [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](./STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md) §4.7  
**Prerequisite:** Checkout address + place-order already wired (shipping path).

## Sequence

1. Set shipping as today (`customerAddressId` **or** `addressSnapshot`)
2. Set billing on the **same** `POST …/address` call (or a follow-up call)
3. Prefer UX checkbox **Same as shipping** → send `billingSameAsShipping: true`
4. Or collect a different billing form → `billingAddressSnapshot` / `billingCustomerAddressId`
5. `POST …/validate` → place order
6. Confirm on `GET /storefront/orders/:orderId` → `addresses[]` has `SHIPPING` and `BILLING`

## One rule

`customerAddressId` and `addressSnapshot` are **shipping only**. Never overload them for billing. Use the billing fields below.

## Key API

```
POST /storefront/checkout/:checkoutSessionId/address
```

| Field | Required | Meaning |
|-------|----------|---------|
| `customerAddressId` | shipping path | Saved shipping address (unchanged) |
| `addressSnapshot` | shipping path | Guest/new shipping snapshot (unchanged) |
| `billingSameAsShipping` | optional | Copy shipping → billing snapshot |
| `billingCustomerAddressId` | optional | Saved billing address book id |
| `billingAddressSnapshot` | optional | Explicit billing JSON snapshot |

At least one of: shipping fields **or** billing fields.

### Recommended — same as shipping

```json
{
  "addressSnapshot": {
    "fullName": "Aisha Hassan",
    "address1": "Marina Walk, Building 5",
    "city": "Dubai",
    "countryCode": "AE",
    "phone": "+971501234567"
  },
  "billingSameAsShipping": true
}
```

### Distinct billing

```json
{
  "customerAddressId": "uuid-shipping",
  "billingAddressSnapshot": {
    "fullName": "Aisha Hassan",
    "address1": "Office Tower 12",
    "city": "Abu Dhabi",
    "countryCode": "AE",
    "phone": "+971501234567"
  }
}
```

Snapshot shape matches shipping: `fullName`, `address1`, `address2?`, `city`, `province?`, `postalCode?`, `countryCode`, `phone?`.

### Logged-in billing from address book

```json
{
  "customerAddressId": "uuid-shipping",
  "billingCustomerAddressId": "uuid-billing"
}
```

## Backend safety net (no FE change required)

If billing is never sent, place-order **clones shipping → BILLING** on new orders. Existing shipping-only clients keep working; both address types still appear on new orders.

FE should still send `billingSameAsShipping: true` (or an explicit billing address) so intent is clear and a later different billing address can override.

## Verify

| Check | Expected |
|-------|----------|
| Order detail `addresses` | One `addressType: "SHIPPING"`, one `"BILLING"` |
| Same-as-shipping | Billing lines match shipping |
| Distinct billing | Billing `address1` / city differ from shipping |
| Admin order detail | Same `addresses[]` with `addressType` |

## Errors

| HTTP | Code | When |
|------|------|------|
| `422` | `CHECKOUT_ADDRESS_INPUT_REQUIRED` | No shipping and no billing fields |
| `422` | `CHECKOUT_BILLING_REQUIRES_SHIPPING` | `billingSameAsShipping` but no shipping on session/request |
| `404` | `CHECKOUT_NOT_FOUND` | Unknown `billingCustomerAddressId` / session |

## Out of scope

- Enforcing payment-method `requiresBillingAddress`
- Backfilling billing on historical orders
- Admin UI redesign (admin already shows typed `addresses[]`)
- Changing cart, delivery-method, payment-method, or place-order request shapes
