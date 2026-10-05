const ORIGIN = "swiss-empty-origin";
const VIEWED = "swiss-viewed";

export function rememberEmptyOrigin(market: string, code: string) {
  if (!market || !code || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(`${ORIGIN}:${market}`, code);
}

export function readEmptyOrigin(market: string): string | null {
  if (!market || typeof sessionStorage === "undefined") return null;
  const value = sessionStorage.getItem(`${ORIGIN}:${market}`)?.trim();
  return value || null;
}

export function rememberViewedProduct(productId: string) {
  if (!productId || typeof sessionStorage === "undefined") return;
  const next = [productId, ...readViewed().filter((id) => id !== productId)].slice(0, 12);
  sessionStorage.setItem(VIEWED, JSON.stringify(next));
}

export function readViewed(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = JSON.parse(sessionStorage.getItem(VIEWED) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((id) => String(id).trim()).filter(Boolean).slice(0, 12);
  } catch {
    return [];
  }
}
