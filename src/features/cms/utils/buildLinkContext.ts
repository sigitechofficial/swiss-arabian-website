import type { CmsSection } from "../types/cmsHome.types";
import type { CmsLinkContext } from "./resolveCmsLink";
import type { CmsCategoryItem, CmsProductCard } from "../types/cmsHome.types";

/** Collect id→slug maps from resolved CMS section payloads for CTA routing. */
export function buildLinkContextFromSections(sections: CmsSection[]): CmsLinkContext {
  const categorySlugs: Record<string, string> = {};
  const productSlugs: Record<string, string> = {};
  const collectionSlugs: Record<string, string> = {};

  for (const section of sections) {
    const data = section.data ?? {};
    const categories = data.categories;
    if (Array.isArray(categories)) {
      for (const cat of categories as CmsCategoryItem[]) {
        if (cat?.id && cat.slug) categorySlugs[cat.id] = cat.slug;
      }
    }
    const products = data.products;
    if (Array.isArray(products)) {
      for (const p of products as CmsProductCard[]) {
        if (p?.productId && p.slug) productSlugs[p.productId] = p.slug;
      }
    }
    const collectionId =
      typeof data.collectionId === "string" ? data.collectionId : null;
    // Collection slug is not always in CMS payload; leave map empty unless present.
    const collectionSlug =
      typeof data.collectionSlug === "string" ? data.collectionSlug : null;
    if (collectionId && collectionSlug) {
      collectionSlugs[collectionId] = collectionSlug;
    }
  }

  return { categorySlugs, productSlugs, collectionSlugs };
}
