import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildSubscriptionMonths,
  subscriptionCheckoutOrderPresentation,
  subscriptionCheckoutShowsPaymentForm,
  subscriptionOrderTrackHref,
} from "./subscriptionMonthlyTracker";

const queue = [
  { variantId: "v1", sku: "VPEA107501", name: "First", position: 1, quantity: 1 },
  { variantId: "v2", sku: "VORA141201", name: "Second", position: 2, quantity: 1 },
];

describe("subscription monthly tracker", () => {
  it("hides the Stripe form only after a confirmed activation", () => {
    expect(subscriptionCheckoutShowsPaymentForm({ paymentState: "SUCCESS", status: "ACTIVE" })).toBe(false);
    expect(subscriptionCheckoutShowsPaymentForm({ paymentState: "SUCCESS", status: "PENDING_ACTIVATION" })).toBe(true);
    expect(subscriptionCheckoutShowsPaymentForm({ paymentState: "PROCESSING", status: "ACTIVE" })).toBe(true);
  });

  it("reuses the order confirmation styles and does not invent an order number", () => {
    const success = readFileSync(resolve("src/features/subscriptions/components/SubscriptionCheckoutSuccess.tsx"), "utf8");
    const checkout = readFileSync(resolve("src/features/subscriptions/components/SubscriptionCheckoutPageView.tsx"), "utf8");
    const retail = readFileSync(resolve("src/features/checkout/components/OrderConfirmationView.tsx"), "utf8");
    const rules = readFileSync(resolve("src/features/subscriptions/utils/subscriptionMonthlyTracker.ts"), "utf8");
    expect(success).toContain("ocHero");
    expect(success).toContain("ocTitle");
    expect(success).toContain("Track first order");
    expect(rules).toContain("Not confirmed on this page");
    expect(rules).toContain("Payment successful — Order processing");
    expect(success).not.toContain("PaymentElement");
    expect(checkout).toContain("SubscriptionCheckoutSuccess");
    expect(checkout).toContain("subscriptionCheckoutSucceeded");
    expect(checkout).not.toContain("OrderConfirmationView");
    expect(retail).toContain("Track order");
    expect(retail).not.toContain("SubscriptionCheckoutSuccess");
  });

  it("shows a confirmed order number and tracking link only when the backend sent one", () => {
    expect(subscriptionOrderTrackHref({})).toBeNull();
    expect(subscriptionOrderTrackHref({ orderId: "order-1" })).toBe("/account/orders/order-1#tracking");
    const months = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: "2026-11-23T06:03:16.354Z",
      queue,
      cycles: [
        { cycleNumber: 1, status: "PAID", orderId: "order-1", orderNumber: "UAE-1", orderStatus: "PAID", fulfillmentStatus: "NOT_READY" },
      ],
    });
    expect(months[0]?.orderNumber).toBe("UAE-1");
    expect(months[0]?.payment).toBe("PAID");
    expect(months[0]?.delivery).toBe("PROCESSING");
    expect(months[0]?.trackHref).toBe("/account/orders/order-1#tracking");
    expect(months[1]?.orderNumber).toBeNull();
    expect(months[1]?.trackHref).toBeNull();
    expect(months[1]?.payment).toBe("UPCOMING");
  });

  it("keeps months without a saved cycle upcoming and does not invent billing dates", () => {
    const months = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: "2026-11-23T06:03:16.354Z",
      queue,
      cycles: [],
    });
    expect(months[0]?.payment).toBe("UPCOMING");
    expect(months[0]?.orderNumber).toBeNull();
    expect(months[0]?.trackHref).toBeNull();
    expect(months[0]?.billingDate).toBe("2026-11-23T06:03:16.354Z");
    expect(months[1]?.fragrance).toBe("Second");
    expect(months[1]?.payment).toBe("UPCOMING");
    expect(months[1]?.billingDate).toBeNull();
    expect(months.filter((row) => row.payment === "PAID")).toHaveLength(0);
  });

  it("repeats replenishment, follows the queue, and uses only the pinned surprise months", () => {
    const replenishment = buildSubscriptionMonths({
      mode: "REPLENISHMENT",
      status: "PENDING_ACTIVATION",
      billingEnabled: false,
      nextBillingAt: null,
      queue: [queue[0]!],
    });
    expect(replenishment.every((row) => row.fragrance === "First" && row.payment === "UPCOMING")).toBe(true);

    const surprise = buildSubscriptionMonths({
      mode: "SURPRISE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: null,
      queue: [],
      surpriseSchedule: {
        scheduleVersionId: "hidden",
        versionNumber: 1,
        audience: "MEN",
        pinned: true,
        allocated: false,
        provisional: true,
        repeatsAfterMonth12: false,
        months: [{ position: 1, variantId: "v1", productId: "p1", sku: "MONTH-1" }],
      },
    });
    expect(surprise[0]?.fragrance).toBe("MONTH-1");
    expect(surprise[1]?.fragrance).toBeNull();
    expect(surprise[11]?.payment).toBe("UPCOMING");
  });

  it("maps shipment separately from payment and does not mark a paid order as shipped", () => {
    const paid = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: null,
      queue,
      cycles: [{ cycleNumber: 1, status: "PAID", orderId: "order-1", orderNumber: "UAE-1", orderStatus: "PAID", fulfillmentStatus: "NOT_READY" }],
    });
    expect(paid[0]?.delivery).not.toBe("SHIPPED");
    expect(paid[0]?.delivery).not.toBe("DELIVERED");

    const shipped = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: null,
      queue,
      cycles: [{ cycleNumber: 1, status: "PAID", orderId: "order-1", orderNumber: "UAE-1", orderStatus: "IN_TRANSIT" }],
    });
    expect(shipped[0]?.delivery).toBe("SHIPPED");
    expect(shipped[0]?.payment).toBe("PAID");

    const delivered = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: null,
      queue,
      cycles: [{ cycleNumber: 1, status: "PAID", orderId: "order-1", orderNumber: "UAE-1", orderStatus: "DELIVERED", fulfillmentStatus: "FULFILLED", shipmentStatus: "DELIVERED" }],
    });
    expect(delivered[0]?.delivery).toBe("DELIVERED");
    expect(paid[0]?.delivery).toBe("PROCESSING");
  });

  it("uses the saved cycle fragrance and only links a confirmed order", () => {
    const months = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: null,
      queue,
      cycles: [{
        cycleNumber: 1,
        status: "PAID",
        sku: "SAVED-SKU",
        orderId: "order-1",
        orderNumber: "UAE-MVKKD8WD-8EA655",
        orderStatus: "PAID",
        fulfillmentStatus: "NOT_READY",
        trackingNumber: "TRK1",
        trackingUrl: "https://track.example/TRK1",
      }],
    });
    expect(months[0]?.fragrance).toBe("SAVED-SKU");
    expect(months[0]?.orderNumber).toBe("UAE-MVKKD8WD-8EA655");
    expect(months[0]?.trackingNumber).toBe("TRK1");
    expect(months[0]?.trackingUrl).toBe("https://track.example/TRK1");
    expect(months[1]?.fragrance).toBe("Second");
    expect(months[1]?.payment).toBe("UPCOMING");

    expect(subscriptionCheckoutOrderPresentation({
      orderState: "CONFIRMED",
      orderId: "order-1",
      orderNumber: "UAE-MVKKD8WD-8EA655",
      fulfillmentStatus: "NOT_READY",
    })).toEqual({
      orderLabel: "UAE-MVKKD8WD-8EA655",
      fulfillmentLabel: "Processing",
      trackHref: "/account/orders/order-1#tracking",
    });
    expect(subscriptionCheckoutOrderPresentation({ orderState: "PENDING" })).toEqual({
      orderLabel: "Payment successful — Order processing",
      fulfillmentLabel: null,
      trackHref: null,
    });
    expect(subscriptionCheckoutOrderPresentation({ orderState: "NONE", orderNumber: "UAE-FAKE" }).trackHref).toBeNull();
    expect(subscriptionCheckoutOrderPresentation({ orderState: "NONE" }).orderLabel).toBe("Not confirmed on this page");
  });
});
