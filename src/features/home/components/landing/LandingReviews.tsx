"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  eyebrow,
  reviewBody,
  reviewCard,
  reviewFoot,
  reviewMark,
  reviewName,
  reviewProduct,
  reviewStars,
  reviewsGrid,
  reviewsHead,
  reviewsRating,
  reviewsSection,
  sectionTitle,
} from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";

export type LandingReviewItem = {
  id: string;
  body: string;
  reviewerName: string;
  productLabel?: string | null;
  rating?: number;
  verifiedBuyer?: boolean;
};

export type LandingReviewsProps = {
  eyebrowText?: string | null;
  heading?: string | null;
  summaryLabel?: string | null;
  items?: LandingReviewItem[];
  displayLimit?: number;
};

function stars(rating = 5) {
  const n = Math.min(5, Math.max(1, Math.round(rating)));
  return "★".repeat(n);
}

export function LandingReviews({
  eyebrowText: eyebrowProp,
  heading: headingProp,
  summaryLabel,
  items,
  displayLimit = 6,
}: LandingReviewsProps = {}) {
  const t = useShopCopy();
  // Not set by the CMS (undefined): the house wording in the page's language.
  const eyebrowText = eyebrowProp === undefined ? t("landing.reviews.eyebrow") : eyebrowProp;
  const heading = headingProp === undefined ? t("landing.reviews.heading") : headingProp;
  const reviews =
    items?.slice(0, displayLimit).map((item) => ({
      id: item.id,
      body: item.body,
      name: item.reviewerName,
      product: [
        item.productLabel,
        item.verifiedBuyer ? t("landing.reviews.verified") : null,
      ]
        .filter(Boolean)
        .join(" · "),
      rating: item.rating ?? 5,
    })) ??
    // Only real reviews (CMS / review data). Never placeholder testimonials.
    [];

  if (!reviews.length) return null;

  return (
    <section className={reviewsSection} id="reviews" aria-labelledby="reviews-heading">
      <div className={pageContainer}>
        <header className={reviewsHead}>
          {eyebrowText ? <p className={eyebrow}>{eyebrowText}</p> : null}
          <p className={sectionTitle} id="reviews-heading">
            {heading}
          </p>
          {summaryLabel ? (
            <p className={reviewsRating}>
              <span className={reviewStars} aria-hidden="true">
                ★★★★★
              </span>
              <span>{summaryLabel}</span>
            </p>
          ) : null}
        </header>
        <ul className={reviewsGrid} role="list">
          {reviews.map((review) => (
            <li className={reviewCard} key={review.id}>
              <span className={reviewMark} aria-hidden="true">
                ”
              </span>
              <span
                className={reviewStars}
                role="img"
                aria-label={t("landing.reviews.rated", { rating: review.rating })}
              >
                {stars(review.rating)}
              </span>
              <p className={reviewBody}>{review.body}</p>
              <div className={reviewFoot}>
                <span className={reviewName}>{review.name}</span>
                {review.product ? (
                  <span className={reviewProduct}>{review.product}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
