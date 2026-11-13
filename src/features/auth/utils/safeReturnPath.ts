/**
 * `?returnTo=` after sign-in / verification: only a path on this site.
 * `//evil.example` and `/\evil.example` start with "/" but browsers treat them
 * as another host, so they (and anything with a scheme or control characters)
 * fall back to `fallback`.
 */
export function safeReturnPath(raw: string | null | undefined, fallback = "/account"): string {
  const value = (raw ?? "").trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://shop.invalid");
    if (url.origin !== "https://shop.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
