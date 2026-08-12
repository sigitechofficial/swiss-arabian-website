/** sessionStorage / localStorage keys and helpers for the checkout + order lifecycle. */

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CHECKOUT_SESSION_KEY = "sa_checkout_session_id";
const ORDER_ID_KEY = "sa_order_id";
const ORDER_NUMBER_KEY = "sa_order_number";
const ORDER_ACCESS_TOKEN_KEY = "sa_order_access_token";

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
