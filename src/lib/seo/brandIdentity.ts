import { cache } from "react";
import { apiGet } from "@/lib/api/apiClient";
import { storefrontLogo } from "@/lib/storefront/brand";

/** Brand as search engines and link previews see it (SEO Management → Brand identity). */
export type BrandIdentity = {
  /** Name in the shopper's language. */
  name: string;
  /** The name in every language (to tell whether a title already names the brand). */
  names: string[];
  description: string | null;
  url: string | null;
  logo: string | null;
  squareLogo: string | null;
  /** Default share image (og:image) for pages without their own image. */
  shareImage: string | null;
  /** Browser tab icon (brand-wide; a market may override it). */
  favicon: string | null;
  /** Social profile addresses. */
  sameAs: string[];
};

/** The storefront's own brand (per domain), when the API cannot be reached. */
export function fallbackBrandIdentity(): BrandIdentity {
  const { name } = storefrontLogo();
  return {
    name,
    names: [name],
    description: null,
    url: null,
    logo: null,
    squareLogo: null,
    shareImage: null,
    favicon: null,
    sameAs: [],
  };
}

/** Brand identity for a market and language. Cached per request. */
export const loadBrandIdentityFor = cache(
  async (locale: string, zoneCode: string): Promise<BrandIdentity> => {
    try {
      const qs = new URLSearchParams({
        locale,
        ...(zoneCode ? { zoneCode } : {}),
      });
      const data = await apiGet<Partial<BrandIdentity>>(
        `/storefront/website/seo/brand-identity?${qs.toString()}`,
        { skipAuth: true },
      );
      const fallback = fallbackBrandIdentity();
      const name = data.name?.trim() || fallback.name;
      return {
        name,
        names: data.names?.length ? data.names : [name],
        description: data.description ?? null,
        url: data.url ?? null,
        logo: data.logo ?? null,
        squareLogo: data.squareLogo ?? null,
        shareImage: data.shareImage ?? null,
        favicon: data.favicon ?? null,
        sameAs: data.sameAs ?? [],
      };
    } catch {
      return fallbackBrandIdentity();
    }
  },
);

/**
 * True when the title already contains the market's site name (in any language),
 * as Shopify does: "… – Swiss Arabian UAE" is not added twice. A shorter name that
 * is part of a full one ("Swiss Arabian" in "Swiss Arabian UAE") does not count:
 * "Shumoukh Al Ghutra 100ml - Swiss Arabian" still gets " – Swiss Arabian UAE".
 */
export function namesBrand(title: string, names: readonly string[]): boolean {
  const lower = title.toLocaleLowerCase();
  const all = names
    .map((name) => name.trim().toLocaleLowerCase())
    .filter(Boolean);
  const siteNames = all.filter(
    (n) => !all.some((other) => other !== n && other.includes(n)),
  );
  return siteNames.some((n) => lower.includes(n));
}
