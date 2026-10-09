import type { CmsLink } from "../types/cmsHome.types";

const UNSAFE_SCHEME = /^(javascript|data|vbscript):/i;

export type CmsLinkContext = {
  /** categoryId → slug */
  categorySlugs?: Record<string, string>;
  /** productId → slug */
  productSlugs?: Record<string, string>;
  /** collectionId → slug */
  collectionSlugs?: Record<string, string>;
};

function sanitizeInternalPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (UNSAFE_SCHEME.test(trimmed)) return null;
  return trimmed;
}

function sanitizeExternalUrl(url: string): string | null {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Resolve a typed CMS link to a storefront href.
 * Returns null for NONE / missing / unsafe destinations.
 */
export function resolveCmsLink(
  link: CmsLink | null | undefined,
  ctx: CmsLinkContext = {},
): string | null {
  if (!link || link.type === "NONE") return null;

  switch (link.type) {
    case "INTERNAL_PATH":
      return link.url ? sanitizeInternalPath(link.url) : null;
    case "EXTERNAL_URL":
      return link.url ? sanitizeExternalUrl(link.url) : null;
    case "PRODUCT": {
      const id = link.referenceId?.trim();
      if (!id) return null;
      const slug = ctx.productSlugs?.[id];
      return slug ? `/products/${encodeURIComponent(slug)}` : "/products";
    }
    case "COLLECTION": {
      const id = link.referenceId?.trim();
      if (!id) return null;
      const slug = ctx.collectionSlugs?.[id];
      return slug ? `/collections/${encodeURIComponent(slug)}` : "/collections";
    }
    case "CATEGORY": {
      const id = link.referenceId?.trim();
      if (!id) return null;
      const slug = ctx.categorySlugs?.[id];
      return slug ? `/categories/${encodeURIComponent(slug)}` : "/products";
    }
    default:
      return null;
  }
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
