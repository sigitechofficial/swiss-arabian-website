import { REVIEWS } from "../../constants/landingContent";

export function LandingReviews() {
  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-heading">
      <div className="container">
        <header className="reviews__head">
          <p className="eyebrow">Loved worldwide</p>
          <h2 className="display reviews__title" id="reviews-heading">
            What our community says
          </h2>
          <p className="reviews__rating">
            <span className="stars" aria-hidden="true">
              ★★★★★
            </span>
            <span className="reviews__rating-text">
              <strong>4.8</strong> · 2,480 verified reviews · 98% recommend
            </span>
          </p>
        </header>
        <ul className="reviews__grid" role="list">
          {REVIEWS.map((review) => (
            <li className="review-card" key={review.name}>
              <span className="review-card__mark" aria-hidden="true">
                ”
              </span>
              <span className="stars" role="img" aria-label="Rated 5 out of 5">
                ★★★★★
              </span>
              <p className="review-card__body">{review.body}</p>
              <div className="review-card__foot">
                <span className="review-card__name">{review.name}</span>
                <span className="review-card__product">{review.product}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
