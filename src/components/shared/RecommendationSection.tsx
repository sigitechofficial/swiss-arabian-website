"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { RecommendedProduct } from "@/lib/analytics/siteEvents";
import { useRecommendationTracking } from "@/lib/analytics/useRecommendationTracking";

type RecommendationSectionProps = {
  /** Where the recommendations are shown, e.g. `pdp_also_like`, `cart_drawer` (report value). */
  surface: string;
  /** The recommended products, in the order shown. */
  products: readonly RecommendedProduct[];
  as?: "section" | "div";
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"section">, "children">;

/**
 * A recommendation section that records which products were shown and clicked, for the product
 * recommendation reports. Renders the same element and classes it is given.
 */
export function RecommendationSection({
  surface,
  products,
  as: Tag = "section",
  children,
  ...rest
}: RecommendationSectionProps) {
  const { ref, onClickCapture } = useRecommendationTracking<HTMLElement>(surface, products);
  return (
    <Tag {...rest} ref={ref as never} onClickCapture={onClickCapture}>
      {children}
    </Tag>
  );
}
