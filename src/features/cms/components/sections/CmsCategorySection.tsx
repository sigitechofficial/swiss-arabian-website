"use client";

import { LandingCollections } from "@/features/home/components/landing/LandingCollections";
import type { CmsCategoryItem } from "../../types/cmsHome.types";

type Props = {
  heading?: string | null;
  subtitle?: string | null;
  categories: CmsCategoryItem[];
  variant: "grid" | "carousel";
  exploreLabel?: string | null;
};

export function CmsCategorySection({
  heading,
  subtitle,
  categories,
  variant,
  exploreLabel,
}: Props) {
  const items = categories
    .filter((c) => c.id && (c.slug || c.name))
    .map((cat) => ({
      id: cat.id,
      href: cat.slug
        ? `/categories/${encodeURIComponent(cat.slug)}`
        : "/products",
      label: cat.name,
      image: cat.image,
    }));

  if (!items.length) return null;

  return (
    <LandingCollections
      heading={heading}
      subtitle={subtitle}
      items={items}
      variant={variant}
      exploreLabel={exploreLabel}
    />
  );
}
