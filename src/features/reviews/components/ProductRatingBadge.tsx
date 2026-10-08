"use client";

import Link from "next/link";
import { useProductReviewSummary } from "../hooks/useProductReviews";
import { StarRating } from "./StarRating";

type ProductRatingBadgeProps = {
  productKey: string;
};

export function ProductRatingBadge({ productKey }: ProductRatingBadgeProps) {
  const { data } = useProductReviewSummary(productKey);

  if (!data || data.reviewCount === 0) return null;

  const countLabel =
    data.reviewCount === 1 ? "1 review" : `${data.reviewCount} reviews`;

  return (
    <Link
      href="#product-reviews"
      className="inline-flex items-center gap-2 text-[13px] text-sa-secondary hover:text-sa-primary"
    >
      <StarRating value={data.averageRating} readOnly size={14} />
      <span className="font-semibold text-sa-primary">
        {data.averageRating.toFixed(1)}
      </span>
      <span>({countLabel})</span>
    </Link>
  );
}
