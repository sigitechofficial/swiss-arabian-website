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

export function LandingReviews() {
  return (
    <section className={reviewsSection} id="reviews" aria-labelledby="reviews-heading">
      <div className={pageContainer}>
        <header className={reviewsHead}>
          <p className={eyebrow}>Loved worldwide</p>
          <h2 className={sectionTitle} id="reviews-heading">
            What our community says
          </h2>
          <p className={reviewsRating}>
            <span className={reviewStars} aria-hidden="true">
              ★★★★★
            </span>
            <span>
              <strong>4.8</strong> · 2,480 verified reviews · 98% recommend
            </span>
          </p>
        </header>
        <ul className={reviewsGrid} role="list">
          {REVIEWS.map((review) => (
            <li className={reviewCard} key={review.name}>
              <span className={reviewMark} aria-hidden="true">
                ”
              </span>
              <span className={reviewStars} role="img" aria-label="Rated 5 out of 5">
                ★★★★★
              </span>
              <p className={reviewBody}>{review.body}</p>
              <div className={reviewFoot}>
                <span className={reviewName}>{review.name}</span>
                <span className={reviewProduct}>{review.product}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
