/** localStorage keys and helpers for guest cart identity (per shop host). */

import { storefrontStorageKey } from "@/lib/storefront/brand";

const GUEST_TOKEN_KEY = "sa_guest_token";
const CART_ID_KEY = "sa_cart_id";

function guestKey(): string {
  return storefrontStorageKey(GUEST_TOKEN_KEY);
}

function cartIdKey(): string {
  return storefrontStorageKey(CART_ID_KEY);
}

function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateGuestToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(guestKey());
    if (existing) return existing;
    const token = generateUuid();
    localStorage.setItem(guestKey(), token);
    return token;
  } catch {
    return generateUuid();
  }
}

export function clearGuestToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(guestKey());
  } catch {
    // ignore
  }
}

export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(cartIdKey());
  } catch {
    return null;
  }
}

export function storeCartId(cartId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cartIdKey(), cartId);
  } catch {
    // ignore
  }
}

export function clearCartId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(cartIdKey());
  } catch {
    // ignore
  }
}
