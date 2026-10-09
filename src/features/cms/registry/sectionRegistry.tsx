import type { ReactNode } from "react";
import type { CmsSection, CmsSectionType } from "../types/cmsHome.types";
import type { CmsLinkContext } from "../utils/resolveCmsLink";
import { resolveCmsLink } from "../utils/resolveCmsLink";
import { mapCmsProducts } from "../utils/mapCmsProduct";
import { CmsHeroBanner } from "../components/sections/CmsHeroBanner";
import { CmsHeroSlider } from "../components/sections/CmsHeroSlider";
import { CmsImageBanner } from "../components/sections/CmsImageBanner";
import { CmsTextBlock } from "../components/sections/CmsTextBlock";
import { CmsCategorySection } from "../components/sections/CmsCategorySection";
import { CmsProductStripSection } from "../components/sections/CmsProductStripSection";
import { CmsImageWithText } from "../components/sections/CmsImageWithText";
import { CmsTrustIndicators } from "../components/sections/CmsTrustIndicators";
import { CmsCollectionShowcase } from "../components/sections/CmsCollectionShowcase";
import { CmsTestimonials } from "../components/sections/CmsTestimonials";
import { CmsBrandStory } from "../components/sections/CmsBrandStory";
import { CmsBundlePromotion } from "../components/sections/CmsBundlePromotion";
import { CmsSubscriptionPlans } from "../components/sections/CmsSubscriptionPlans";
import { CmsNewsletterSignup } from "../components/sections/CmsNewsletterSignup";
import { CmsFragranceNotesShowcase } from "../components/sections/CmsFragranceNotesShowcase";
import { CmsShopableVideoShowcase } from "../components/sections/CmsShopableVideoShowcase";
import type { CmsCategoryItem, CmsLink } from "../types/cmsHome.types";

export type RenderSectionOptions = {
  linkContext?: CmsLinkContext;
  /** When true, log unknown types (preview/dev). */
  logUnknown?: boolean;
};

function asCategories(raw: unknown): CmsCategoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is CmsCategoryItem =>
      Boolean(c && typeof c === "object" && "id" in c && "name" in c),
  );
}

function asLink(raw: unknown): CmsLink | null {
  if (!raw || typeof raw !== "object") return null;
  const link = raw as CmsLink;
  if (!link.type) return null;
  return link;
}

/**
 * Map one CMS section to a storefront React node.
 * Returns null for empty/invalid optional sections or unknown types.
 */
export function renderCmsSection(
  section: CmsSection,
  options: RenderSectionOptions = {},
): ReactNode {
  const { linkContext, logUnknown } = options;
  const data = section.data ?? {};
  const type = section.type as CmsSectionType;

  try {
    switch (type) {
      case "HERO_BANNER":
        return (
          <CmsHeroBanner
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "HERO_SLIDER":
        return (
          <CmsHeroSlider
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "IMAGE_BANNER":
        return (
          <CmsImageBanner
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "TEXT_BLOCK":
        return <CmsTextBlock key={section.id} data={data} />;
      case "TRUST_INDICATORS":
        return <CmsTrustIndicators key={section.id} data={data} />;
      case "CATEGORY_GRID": {
        const categories = asCategories(data.categories);
        if (!categories.length) return null;
        return (
          <CmsCategorySection
            key={section.id}
            heading={typeof data.heading === "string" ? data.heading : null}
            subtitle={typeof data.subtitle === "string" ? data.subtitle : null}
            categories={categories}
            variant="grid"
          />
        );
      }
      case "CATEGORY_CAROUSEL": {
        const categories = asCategories(data.categories);
        if (!categories.length) return null;
        return (
          <CmsCategorySection
            key={section.id}
            heading={typeof data.heading === "string" ? data.heading : null}
            subtitle={typeof data.subtitle === "string" ? data.subtitle : null}
            categories={categories}
            variant="carousel"
          />
        );
      }
      case "COLLECTION_SHOWCASE":
        return (
          <CmsCollectionShowcase
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "PRODUCT_CAROUSEL":
      case "FEATURED_COLLECTION": {
        const products = mapCmsProducts(data.products);
        if (!products.length) return null;
        const heading =
          typeof data.heading === "string" && data.heading.trim()
            ? data.heading.trim()
            : type === "FEATURED_COLLECTION"
              ? "Featured Collection"
              : "Products";
        const viewAllHref =
          resolveCmsLink(asLink(data.link), linkContext) ||
          (type === "FEATURED_COLLECTION" ? "/collections" : "/products");
        return (
          <CmsProductStripSection
            key={section.id}
            title={heading}
            products={products}
            viewAllHref={viewAllHref}
            viewAllLabel={
              typeof data.viewAllLabel === "string" ? data.viewAllLabel : null
            }
            variant="productsBand"
          />
        );
      }
      case "TRENDING_PRODUCTS": {
        const products = mapCmsProducts(data.products);
        if (!products.length) return null;
        const heading =
          typeof data.heading === "string" && data.heading.trim()
            ? data.heading.trim()
            : "Trending Now";
        const viewAllHref =
          resolveCmsLink(asLink(data.link), linkContext) || "/products";
        return (
          <CmsProductStripSection
            key={section.id}
            title={heading}
            products={products}
            viewAllHref={viewAllHref}
            viewAllLabel={
              typeof data.viewAllLabel === "string" ? data.viewAllLabel : null
            }
            variant="trending"
          />
        );
      }
      case "IMAGE_WITH_TEXT":
        return (
          <CmsImageWithText
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "BRAND_STORY":
        return (
          <CmsBrandStory
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "BUNDLE_PROMOTION_SHOWCASE":
        return (
          <CmsBundlePromotion
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "TESTIMONIALS":
        return <CmsTestimonials key={section.id} data={data} />;
      case "SUBSCRIPTION_PLANS_SHOWCASE":
        return (
          <CmsSubscriptionPlans
            key={section.id}
            data={data}
            linkContext={linkContext}
          />
        );
      case "NEWSLETTER_SIGNUP":
        return <CmsNewsletterSignup key={section.id} data={data} />;
      case "FRAGRANCE_NOTES_SHOWCASE":
        return <CmsFragranceNotesShowcase key={section.id} data={data} />;
      case "SHOPABLE_VIDEO_SHOWCASE":
        return <CmsShopableVideoShowcase key={section.id} data={data} />;
      default:
        if (logUnknown && typeof console !== "undefined") {
          console.warn(`[cms] Unknown section type skipped: ${section.type}`);
        }
        return null;
    }
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn(
        `[cms] Section ${section.id} (${section.type}) failed to render`,
        err,
      );
    }
    return null;
  }
}

/** Sort by backend position and render; skips nulls. */
export function renderCmsSections(
  sections: CmsSection[],
  options: RenderSectionOptions = {},
): ReactNode[] {
  const ordered = [...sections].sort((a, b) => a.position - b.position);
  return ordered
    .map((section) => renderCmsSection(section, options))
    .filter(Boolean);
}
