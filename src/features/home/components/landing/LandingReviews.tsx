import { REVIEWS } from "../../constants/landingContent";
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
  eyebrowText = "Loved worldwide",
  heading = "What our community says",
  summaryLabel,
  items,
  displayLimit = 6,
}: LandingReviewsProps = {}) {
  const reviews =
    items?.slice(0, displayLimit).map((item) => ({
      id: item.id,
      body: item.body,
      name: item.reviewerName,
      product: [
        item.productLabel,
        item.verifiedBuyer ? "Verified buyer" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      rating: item.rating ?? 5,
    })) ??
    REVIEWS.map((review, index) => ({
      id: `legacy-${index}`,
      body: review.body,
      name: review.name,
      product: review.product,
      rating: 5,
    }));

  if (!reviews.length) return null;

  return (
    <section className={reviewsSection} id="reviews" aria-labelledby="reviews-heading">
      <div className={pageContainer}>
        <header className={reviewsHead}>
          {eyebrowText ? <p className={eyebrow}>{eyebrowText}</p> : null}
          <h2 className={sectionTitle} id="reviews-heading">
            {heading}
          </h2>
          {summaryLabel ? (
            <p className={reviewsRating}>
              <span className={reviewStars} aria-hidden="true">
                ★★★★★
              </span>
              <span>{summaryLabel}</span>
            </p>
          ) : !items ? (
            <p className={reviewsRating}>
              <span className={reviewStars} aria-hidden="true">
                ★★★★★
              </span>
              <span>
                <strong>4.8</strong> · 2,480 verified reviews · 98% recommend
              </span>
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
                aria-label={`Rated ${review.rating} out of 5`}
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
