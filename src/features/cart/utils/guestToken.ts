/** localStorage keys and helpers for guest cart identity. */

const GUEST_TOKEN_KEY = "sa_guest_token";
const CART_ID_KEY = "sa_cart_id";

function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Polyfill for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Return the stored guest token or generate + persist a new one. */
export function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(GUEST_TOKEN_KEY);
    if (existing) return existing;
    const token = generateUuid();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
    return token;
  } catch {
    return generateUuid();
  }
}

/** Remove the guest token after login — customer JWT is now authoritative. */
export function clearGuestToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

export function storeCartId(cartId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_ID_KEY, cartId);
  } catch {
    // ignore
  }
}

export function clearCartId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CART_ID_KEY);
  } catch {
    // ignore
  }
}
