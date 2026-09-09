"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { FALLBACK_REVIEWS, type ProductReview } from "../constants/productDetailContent";
import { writeReviewSchema, type WriteReviewValues } from "../schemas/review.schema";

function starsLabel(rating: number) {
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

export function PdpReviews({ productTitle }: { productTitle: string }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>(FALLBACK_REVIEWS);

  const form = useForm<WriteReviewValues>({
    resolver: zodResolver(writeReviewSchema),
    defaultValues: { rating: 5, title: "", body: "", name: "", email: "" },
  });
  const rating = form.watch("rating");

  const step = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".pdp-reviews__item");
    const width = card instanceof HTMLElement ? card.getBoundingClientRect().width + 16 : 420;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  const onSubmit = (values: WriteReviewValues) => {
    setReviews((prev) => [
      { name: values.name, body: `${values.title}. ${values.body}`, rating: values.rating },
      ...prev,
    ]);
    form.reset({ rating: 5, title: "", body: "", name: "", email: "" });
    setOpen(false);
    toast("Your review is shown below. It isn’t saved to the catalog yet.", "info");
  };

  return (
    <section className="pdp-reviews" id="pdp-reviews" aria-labelledby="pdp-reviews-heading">
      <div className="container container--full">
        <header className="pdp-reviews__head">
          <div className="pdp-reviews__head-copy">
            <p className="pdp-composition__eyebrow">Customer reviews</p>
            <h2 className="pdp-reviews__title" id="pdp-reviews-heading">
              What customers <em className="pdp-composition__em">say.</em>
            </h2>
          </div>
          <div className="pdp-reviews__head-actions">
            {reviews.length > 1 ? (
              <div className="pdp-reviews__nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous review">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next review">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : null}
            <button type="button" className="pdp-reviews__write" onClick={() => setOpen((v) => !v)}>
              {open ? "Close" : "Write a review"}
            </button>
          </div>
        </header>

        {open ? (
          <form className="pdp-review-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className="pdp-review-form__intro">
              <h3>Write a review</h3>
              <p>Share how {productTitle} wears on you. Your email stays private.</p>
            </div>
            <div className="pdp-review-form__grid">
              <label className="fld">
                <span>Overall rating</span>
                <div className="pdp-review-form__rating" role="radiogroup" aria-label="Overall rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={rating >= value ? "is-on" : ""}
                      aria-checked={rating === value}
                      role="radio"
                      onClick={() => form.setValue("rating", value, { shouldValidate: true })}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {form.formState.errors.rating ? (
                  <span className="fld__err">{form.formState.errors.rating.message}</span>
                ) : null}
              </label>
              <label className="fld">
                <span>Review title</span>
                <input type="text" placeholder="A signature, not a trend" {...form.register("title")} />
                {form.formState.errors.title ? (
                  <span className="fld__err">{form.formState.errors.title.message}</span>
                ) : null}
              </label>
              <label className="fld fld--full">
                <span>Your review</span>
                <textarea rows={5} placeholder="Longevity, sillage, when you wear it…" {...form.register("body")} />
                {form.formState.errors.body ? (
                  <span className="fld__err">{form.formState.errors.body.message}</span>
                ) : null}
              </label>
              <label className="fld">
                <span>Display name</span>
                <input type="text" autoComplete="name" placeholder="Amira K." {...form.register("name")} />
                {form.formState.errors.name ? (
                  <span className="fld__err">{form.formState.errors.name.message}</span>
                ) : null}
              </label>
              <label className="fld">
                <span>Email</span>
                <input type="email" autoComplete="email" placeholder="you@email.com" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <span className="fld__err">{form.formState.errors.email.message}</span>
                ) : null}
              </label>
            </div>
            <div className="pdp-review-form__foot">
              <p>By submitting, you confirm this is your own experience with the fragrance.</p>
              <button className="pdp-review-form__submit" type="submit">
                Submit review
              </button>
            </div>
          </form>
        ) : null}

        <div className="pdp-reviews__swiper">
          <ul className="pdp-reviews__list" ref={scrollerRef} role="list">
            {reviews.map((review, index) => (
              <li className="pdp-reviews__item" key={`${review.name}-${index}`}>
                <span className="stars" role="img" aria-label={`Rated ${review.rating ?? 5} out of 5`}>
                  {starsLabel(review.rating ?? 5)}
                </span>
                <p className="pdp-reviews__body">{review.body}</p>
                <p className="pdp-reviews__meta">
                  {review.name} · {productTitle}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
