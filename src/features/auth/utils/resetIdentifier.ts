/**
 * The email or phone a shopper asked a reset code for, carried from
 * "forgot password" to the reset page in this tab's session storage, so it
 * never appears in the address (history, analytics, referrers, server logs).
 */
const RESET_IDENTIFIER_KEY = "sa_reset_identifier";

export function storeResetIdentifier(identifier: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RESET_IDENTIFIER_KEY, identifier);
  } catch {
    // Storage blocked: the shopper types it on the reset page.
  }
}

export function readResetIdentifier(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(RESET_IDENTIFIER_KEY) || null;
  } catch {
    return null;
  }
}

export function clearResetIdentifier(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RESET_IDENTIFIER_KEY);
  } catch {
    // ignore
  }
}
