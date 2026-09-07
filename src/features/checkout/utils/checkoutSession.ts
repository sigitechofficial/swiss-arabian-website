/** sessionStorage / localStorage keys and helpers for the checkout + order lifecycle. */

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CHECKOUT_SESSION_KEY = "sa_checkout_session_id";
const ORDER_ID_KEY = "sa_order_id";
const ORDER_NUMBER_KEY = "sa_order_number";

// Payment-specific keys (sessionStorage — cleared after payment confirmed)
const ZONE_PAYMENT_METHOD_ID_KEY = "sa_zone_payment_method_id";
const PAYMENT_TRANSACTION_ID_KEY = "sa_payment_transaction_id";
const PAY_ATTEMPT_KEY = "sa_pay_attempt";

// ─── Checkout session (sessionStorage — tab-scoped) ──────────────────────────

export function getStoredCheckoutSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(CHECKOUT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function storeCheckoutSessionId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, id);
  } catch {
    // ignore
  }
}

export function clearCheckoutSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  } catch {
    // ignore
  }
}

// ─── Order keys (localStorage — persists across tabs) ───────────────────────

export function storeOrderId(orderId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDER_ID_KEY, orderId);
  } catch {
    // ignore
  }
}

export function getStoredOrderId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ORDER_ID_KEY);
  } catch {
    return null;
  }
}

export function storeOrderNumber(orderNumber: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDER_NUMBER_KEY, orderNumber);
  } catch {
    // ignore
  }
}

export function getStoredOrderNumber(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ORDER_NUMBER_KEY);
  } catch {
    return null;
  }
}

/** Guest tracking token keyed by order number — never use a global key. */
function guestTokenKey(orderNumber: string): string {
  return `sa_order_token_${orderNumber}`;
}

/**
 * Save guest order access token for a specific order.
 * Token is one-time from place-order; key by orderNumber so later orders
 * do not overwrite earlier ones.
 */
export function storeGuestOrderAccessToken(orderNumber: string, token: string): void {
  if (typeof window === "undefined" || !orderNumber || !token) return;
  try {
    localStorage.setItem(guestTokenKey(orderNumber), token);
  } catch {
    // ignore
  }
}

export function getStoredGuestOrderAccessToken(orderNumber: string): string | null {
  if (typeof window === "undefined" || !orderNumber) return null;
  try {
    // Prefer order-scoped key
    const keyed = localStorage.getItem(guestTokenKey(orderNumber));
    if (keyed) return keyed;
    // Legacy fallback (pre-fix global key) — only if it matches current order context
    return null;
  } catch {
    return null;
  }
}

type StoredGuestOrderLine = {
  orderLineId: string;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
};

function guestLinesKey(orderNumber: string): string {
  return `sa_order_lines_${orderNumber}`;
}

/** Cache place-order line UUIDs so guest returns/exchanges can use them on /track. */
export function storeGuestOrderLines(
  orderNumber: string,
  lines: StoredGuestOrderLine[],
): void {
  if (typeof window === "undefined" || !orderNumber || lines.length === 0) return;
  try {
    localStorage.setItem(guestLinesKey(orderNumber), JSON.stringify(lines));
  } catch {
    // ignore
  }
}

export function getStoredGuestOrderLines(
  orderNumber: string,
): StoredGuestOrderLine[] {
  if (typeof window === "undefined" || !orderNumber) return [];
  try {
    const raw = localStorage.getItem(guestLinesKey(orderNumber));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<StoredGuestOrderLine>;
      if (!row.orderLineId || !row.sku) return [];
      const quantity = Number(row.quantity);
      return [
        {
          orderLineId: row.orderLineId,
          sku: row.sku,
          productName: row.productName ?? null,
          variantName: row.variantName ?? null,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        },
      ];
    });
  } catch {
    return [];
  }
}

// ─── Payment state (sessionStorage) ──────────────────────────────────────────

function ssGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function ssSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(key, value); } catch { /* ignore */ }
}
function ssRemove(key: string): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

/** The zonePaymentMethodId chosen during checkout — needed for payment retry. */
export function storeZonePaymentMethodId(id: string): void {
  ssSet(ZONE_PAYMENT_METHOD_ID_KEY, id);
}
export function getStoredZonePaymentMethodId(): string | null {
  return ssGet(ZONE_PAYMENT_METHOD_ID_KEY);
}

/** The paymentTransactionId returned by initiate — useful for logging/debugging. */
export function storePaymentTransactionId(id: string): void {
  ssSet(PAYMENT_TRANSACTION_ID_KEY, id);
}
export function getStoredPaymentTransactionId(): string | null {
  return ssGet(PAYMENT_TRANSACTION_ID_KEY);
}

/** Idempotency attempt counter — increments on each retry. Starts at 1. */
export function getPayAttempt(): number {
  return Number(ssGet(PAY_ATTEMPT_KEY) ?? "1");
}
export function incrementPayAttempt(): number {
  const next = getPayAttempt() + 1;
  ssSet(PAY_ATTEMPT_KEY, String(next));
  return next;
}

/** Clear all payment-specific session state after payment is confirmed (success or final failure). */
export function clearPaymentState(): void {
  ssRemove(ZONE_PAYMENT_METHOD_ID_KEY);
  ssRemove(PAYMENT_TRANSACTION_ID_KEY);
  ssRemove(PAY_ATTEMPT_KEY);
  ssRemove("sa_stripe_client_secret");
  ssRemove("sa_stripe_publishable_key");
}

// ─── Stripe-specific (sessionStorage — never persist to localStorage) ─────────

/**
 * Stripe PaymentIntent client secret — kept in memory ideally;
 * stored in sessionStorage only to survive the stripe page route.
 * Never store in localStorage or logs.
 */
export function storeStripeClientSecret(secret: string): void {
  ssSet("sa_stripe_client_secret", secret);
}
export function getStoredStripeClientSecret(): string | null {
  return ssGet("sa_stripe_client_secret");
}
export function clearStripeClientSecret(): void {
  ssRemove("sa_stripe_client_secret");
}

/** Stripe publishable key from initiate response metadata — not a secret. */
export function storeStripePublishableKey(key: string): void {
  ssSet("sa_stripe_publishable_key", key);
}
export function getStoredStripePublishableKey(): string | null {
  return ssGet("sa_stripe_publishable_key");
}
