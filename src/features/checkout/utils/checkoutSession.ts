/** sessionStorage / localStorage keys and helpers for the checkout + order lifecycle. */

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CHECKOUT_SESSION_KEY = "sa_checkout_session_id";
const ORDER_ID_KEY = "sa_order_id";
const ORDER_NUMBER_KEY = "sa_order_number";
const ORDER_ACCESS_TOKEN_KEY = "sa_order_access_token";

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

/** Save guest order access token — issued only once; never overwrite an existing token. */
export function storeGuestOrderAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(ORDER_ACCESS_TOKEN_KEY);
    if (!existing) {
      localStorage.setItem(ORDER_ACCESS_TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
}

export function getStoredGuestOrderAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ORDER_ACCESS_TOKEN_KEY);
  } catch {
    return null;
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
}
