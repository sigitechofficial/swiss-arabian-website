/** Browser-storage helpers for the checkout → order → payment lifecycle. */

const CHECKOUT_SESSION_KEY = "sa_checkout_session_id";
const ORDER_ID_KEY = "sa_order_id";
const ORDER_NUMBER_KEY = "sa_order_number";

const ZONE_PAYMENT_METHOD_ID_KEY = "sa_zone_payment_method_id";
const PAYMENT_METHOD_ID_KEY = "sa_payment_method_id";
const PAYMENT_TRANSACTION_ID_KEY = "sa_payment_transaction_id";
const PAY_ATTEMPT_KEY = "sa_pay_attempt";
const STRIPE_CLIENT_SECRET_KEY = "sa_stripe_client_secret";
const STRIPE_PUBLISHABLE_KEY_KEY = "sa_stripe_publishable_key";

function read(storage: "local" | "session", key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (storage === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function write(storage: "local" | "session", key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    (storage === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // Storage blocked — the flow still works for this page view.
  }
}

function remove(storage: "local" | "session", key: string): void {
  if (typeof window === "undefined") return;
  try {
    (storage === "local" ? localStorage : sessionStorage).removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Checkout session (sessionStorage — tab-scoped) ─────────────────────────

export const getStoredCheckoutSessionId = () => read("session", CHECKOUT_SESSION_KEY);
export const storeCheckoutSessionId = (id: string) =>
  write("session", CHECKOUT_SESSION_KEY, id);
export const clearCheckoutSessionId = () => remove("session", CHECKOUT_SESSION_KEY);

// ─── Order (localStorage — survives the gateway redirect) ───────────────────

export const getStoredOrderId = () => read("local", ORDER_ID_KEY);
export const storeOrderId = (id: string) => write("local", ORDER_ID_KEY, id);

export const getStoredOrderNumber = () => read("local", ORDER_NUMBER_KEY);
export const storeOrderNumber = (number: string) =>
  write("local", ORDER_NUMBER_KEY, number);

/**
 * Guest tracking proof is issued once, on first creation. Keyed per order
 * number so a later order never overwrites an earlier one's token.
 */
export function storeGuestOrderAccessToken(orderNumber: string, token: string): void {
  if (!orderNumber || !token) return;
  write("local", `sa_order_token_${orderNumber}`, token);
}

export function getStoredGuestOrderAccessToken(orderNumber: string): string | null {
  return orderNumber ? read("local", `sa_order_token_${orderNumber}`) : null;
}

type StoredGuestOrderLine = {
  orderLineId: string;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
};

/** Cache place-order line ids so guest returns and exchanges can use them on /track. */
export function storeGuestOrderLines(
  orderNumber: string,
  lines: StoredGuestOrderLine[],
): void {
  if (!orderNumber || lines.length === 0) return;
  write("local", `sa_order_lines_${orderNumber}`, JSON.stringify(lines));
}

export function getStoredGuestOrderLines(orderNumber: string): StoredGuestOrderLine[] {
  if (!orderNumber) return [];
  const raw = read("local", `sa_order_lines_${orderNumber}`);
  if (!raw) return [];
  try {
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

// ─── Payment attempt (sessionStorage) ───────────────────────────────────────

export const storeZonePaymentMethodId = (id: string) =>
  write("session", ZONE_PAYMENT_METHOD_ID_KEY, id);
export const getStoredZonePaymentMethodId = () =>
  read("session", ZONE_PAYMENT_METHOD_ID_KEY);

export const storePaymentMethodId = (id: string) =>
  write("session", PAYMENT_METHOD_ID_KEY, id);
export const getStoredPaymentMethodId = () => read("session", PAYMENT_METHOD_ID_KEY);

export const storePaymentTransactionId = (id: string) =>
  write("session", PAYMENT_TRANSACTION_ID_KEY, id);

/** Feeds the idempotency key `pay-{orderId}-{attempt}`; starts at 1. */
export function getPayAttempt(): number {
  const n = Number(read("session", PAY_ATTEMPT_KEY) ?? "1");
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** A new order starts its own attempt count. */
export const resetPayAttempt = () => write("session", PAY_ATTEMPT_KEY, "1");

/** A gateway session is single-use — retries need a fresh idempotency key. */
export function incrementPayAttempt(): number {
  const next = getPayAttempt() + 1;
  write("session", PAY_ATTEMPT_KEY, String(next));
  return next;
}

export function clearPaymentState(): void {
  remove("session", ZONE_PAYMENT_METHOD_ID_KEY);
  remove("session", PAYMENT_METHOD_ID_KEY);
  remove("session", PAYMENT_TRANSACTION_ID_KEY);
  remove("session", PAY_ATTEMPT_KEY);
  remove("session", STRIPE_CLIENT_SECRET_KEY);
  remove("session", STRIPE_PUBLISHABLE_KEY_KEY);
}

// ─── Stripe (sessionStorage only — never localStorage, never logged) ────────

export const storeStripeClientSecret = (secret: string) =>
  write("session", STRIPE_CLIENT_SECRET_KEY, secret);
export const getStoredStripeClientSecret = () => read("session", STRIPE_CLIENT_SECRET_KEY);
export const clearStripeClientSecret = () => remove("session", STRIPE_CLIENT_SECRET_KEY);

/** Not a secret — it comes back on the initiate response. */
export const storeStripePublishableKey = (key: string) =>
  write("session", STRIPE_PUBLISHABLE_KEY_KEY, key);
export const getStoredStripePublishableKey = () =>
  read("session", STRIPE_PUBLISHABLE_KEY_KEY);
