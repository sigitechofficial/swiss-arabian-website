const KEY = "sa-pending-coupon";

export function stashPendingCoupon(code: string) {
  const trimmed = code.trim();
  if (!trimmed || typeof window === "undefined") return;
  sessionStorage.setItem(KEY, trimmed);
}

export function peekPendingCoupon(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(KEY)?.trim();
  return value || null;
}

export function takePendingCoupon(): string | null {
  const value = peekPendingCoupon();
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
  return value;
}

export function couponLoginHref(returnTo: string, code: string): string {
  const path = returnTo.startsWith("/checkout") || returnTo === "/cart" ? returnTo : "/cart";
  stashPendingCoupon(code);
  return `/login?returnTo=${encodeURIComponent(path)}`;
}
