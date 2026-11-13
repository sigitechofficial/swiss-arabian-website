# Sapil: order confirmation, orders and tracking

v9 source: `sapil-v9-order.html` (`.od`, `.od-hero`, `.track`, `.od-grid`, `.od-card`,
`.od-lines`, `.od-hist`, `.od-actions`). The design keeps orders in localStorage; here
every value comes from the order, account-orders and tracking APIs.

## Routes and components

| Route | `@brand-ui` name | Sapil component |
|---|---|---|
| `/order-confirmation/[orderId]` | `OrderConfirmationView` | `pages/orders/SapilOrderConfirmationPage.tsx` |
| `/account/orders` | `PurchaseHistoryPageView` | `pages/orders/SapilOrdersPage.tsx` (v9 "Your orders") |
| `/account/orders/[id]` | `AccountOrderDetailPageView` | `pages/orders/SapilOrderDetailPage.tsx` |
| `/track` | `TrackLookupView` | `pages/orders/SapilTrackPages.tsx` → `SapilTrackLookupPage` |
| `/track/[orderNumber]` | `GuestTrackingPageView` | `SapilGuestTrackingPage` |

Shared view: `components/orders/SapilOrderView.tsx` (hero, tracker, items + totals, side
cards, actions), `orderParts.tsx` (steps, frozen totals, lines, address), `TrackingDetails.tsx`
(shipments, carrier link, event history).

## Data sources

| Page | Hook (shared) | Endpoints |
|---|---|---|
| Confirmation | `useOrderConfirmation` | `GET /storefront/orders/:id`, payment-status polling while an online payment is pending |
| Your orders | `useCustomerOrders` | `GET /storefront/customer/orders` (paged) |
| Order detail | `useCustomerOrderDetail`, `useCancellationCountdown` | customer order detail, order tracking + timeline, cancel |
| Track lookup | `useTrackLookup` | token stored for the order, never in the URL |
| Guest tracking | `useGuestTracking` | `GET /storefront/order-tracking/:orderNumber` (+ timeline) as owner or with the order access token |

## Hooks extracted (Swiss Arabian now uses them, no visible change)

| Hook | Swiss Arabian component |
|---|---|
| `useOrderConfirmation` (+ `orderPaymentState`, `paysOffline`, `orderConfirmationDetails`) | `OrderConfirmationView` |
| `useCustomerOrders` | `PurchaseHistoryPageView` |
| `useCustomerOrderDetail`, `useCancellationCountdown` | `AccountOrderDetailPageView` |
| `useTrackLookup`, `useGuestTracking` | `TrackLookupView`, `GuestTrackingPageView` |

## What maps where

- Hero: mint when confirmed, butter while the payment is processing, peach when it failed
  (with "Retry payment" → `/checkout/payment/cancel?orderId=`). Eyebrow "Order {number} ·
  placed {date}" with a copy button. Headline v9 ("Thank you, {first name}. *Your order is
  confirmed.*").
- `.od-eta` box: the tracking API's `estimatedDeliveryAt` when there is one (order detail,
  tracking); otherwise the order total and payment method (confirmation has no ETA).
- Tracker: the platform's five steps (Placed, Confirmed, Preparing, Shipped, Delivered;
  v9 shows four). Steps up to the current one are done, the next one is ringed. Orders off
  the delivery path (cancelled, refunded, review, failed) show a status line instead.
- Totals: the order's frozen subtotal / discount / delivery / tax / total. "Includes … VAT"
  when the order's numbers show the tax is inside the total, else a VAT row.
- Payment card: "Paid …", or for cash on delivery "Have … ready for the courier" (no COD fee:
  the platform has none).

## Known differences from v9

- No "Pair it with something new" rail (catalog agent's card; add with the related-products
  data), no "Buy again" per line (order lines have no product slug), no WhatsApp /
  cancel buttons in the help card (cancel lives in the cancellation-window panel on the
  order detail; WhatsApp needs a Sapil care number).
- Delivery step dates (`Mon 16 Nov`) are not shown: the APIs give no per-step times on the
  confirmation; the tracking history shows carrier event times.
- Product images on lines show only when the API returns an absolute URL; tiles use the
  neutral `sand` pastel until `tileColor`.
- Not visually diffed (depends on order data); structure and spacing follow the v9 CSS
  1:1 (`od-hero`, `track`, `od-grid`, `od-card`, `od-lines`, `od-hist`).

## Open questions

- Sapil care contact (WhatsApp / phone) for the help card.
- Should guest confirmations link to `/track/{number}` (current) or show tracking inline?
