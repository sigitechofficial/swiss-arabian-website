/** Strip tags for plain-text fields (subtitle, cards, notes). */
export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Allowlist sanitizer for catalog HTML (p, br, lists, emphasis only).
 * No dependency — strips scripts/handlers before PDP render.
 */
export function sanitizeCatalogHtml(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";

  let html = value
    .replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|link|meta)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, "");

  html = html.replace(
    /<\/?(?!\/?(?:p|br|ul|ol|li|strong|em|b|i|span)\b)[a-z0-9:-]+\b[^>]*>/gi,
    "",
  );

  return html.trim();
}

/** Bullet lines from CMS HTML (• Item). */
export function notesFromCatalogHtml(
  html: string | null | undefined,
  limit = 6,
): string[] {
  if (!html) return [];
  const fromBullets = [...html.matchAll(/[•·]\s*([^<\n]+)/g)]
    .map((m) => stripHtml(m[1]))
    .filter(Boolean);
  if (fromBullets.length) return fromBullets.slice(0, limit);

  return stripHtml(html)
    .split(/[·,|/]/)
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, limit);
}
