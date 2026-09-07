"use client";

import { Star } from "lucide-react";

type StarRatingProps = {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
  label?: string;
};

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  label = "Rating",
}: StarRatingProps) {
  const filled = Math.round(Math.min(5, Math.max(0, value)));
  const interactive = Boolean(onChange) && !readOnly;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        interactive ? label : `${filled} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isOn = star <= filled;
        const className = `text-gold ${interactive ? "cursor-pointer" : ""}`;
        if (!interactive) {
          return (
            <Star
              key={star}
              size={size}
              strokeWidth={1.5}
              fill={isOn ? "currentColor" : "none"}
              className={className}
              aria-hidden
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange?.(star)}
            className={`${className} rounded-sm p-0.5 hover:opacity-80`}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              fill={isOn ? "currentColor" : "none"}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
