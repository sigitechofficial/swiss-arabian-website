"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { ApiClientError } from "@/lib/api/apiError";
import { toastApiError } from "@/lib/api/toastApiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { createCustomerReview } from "../api/reviews.service";
import { writeReviewSchema, type WriteReviewValues } from "../schemas/review.schema";
import type { StorefrontPdpReviews } from "../types/pdpReviews";
import { reviewStarsLabel } from "../utils/pdpReviews";

export function PdpReviews({
  productId,
  productTitle,
  variantId,
  reviews,
}: {
  productId: string;
  productTitle: string;
  variantId?: string;
  reviews: StorefrontPdpReviews | null | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const items = reviews?.items ?? [];
  const reviewCount = reviews?.summary.reviewCount ?? 0;

  const form = useForm<WriteReviewValues>({
    resolver: zodResolver(writeReviewSchema),
    defaultValues: { rating: 5, title: "", body: "", name: "" },
  });
  const rating = form.watch("rating");

  const step = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(".pdp-reviews__item");
    const width = card instanceof HTMLElement ? card.getBoundingClientRect().width + 16 : 420;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  const toggleWrite = () => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!open) {
      const display =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
      if (display) form.setValue("name", display);
    }
    setOpen((v) => !v);
  };

  const onSubmit = async (values: WriteReviewValues) => {
    setSubmitting(true);
    try {
      await createCustomerReview({
        productId,
        rating: values.rating,
        title: values.title?.trim() || undefined,
        body: values.body.trim(),
        displayName: values.name.trim(),
        variantId,
      });
      form.reset({ rating: 5, title: "", body: "", name: values.name });
      setOpen(false);
      toast("Submitted — visible after approval.", "success");
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
        return;
      }
      if (error instanceof ApiClientError && error.status === 409) {
        toast("You already reviewed this product.", "info");
        return;
      }
      if (error instanceof ApiClientError && error.status === 422) {
        toast("You can only review products from your completed orders.", "info");
        return;
      }
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
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
            {items.length > 1 ? (
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
            <button type="button" className="pdp-reviews__write" onClick={toggleWrite}>
              {open ? "Close" : "Write a review"}
            </button>
          </div>
        </header>

        {open ? (
          <form className="pdp-review-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className="pdp-review-form__intro">
              <h3>Write a review</h3>
              <p>Share how {productTitle} wears on you. It appears after approval.</p>
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
            </div>
            <div className="pdp-review-form__foot">
              <p>By submitting, you confirm this is your own experience with the fragrance.</p>
              <button className="pdp-review-form__submit" type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </form>
        ) : null}

        {items.length ? (
          <div className="pdp-reviews__swiper">
            <ul className="pdp-reviews__list" ref={scrollerRef} role="list">
              {items.map((review) => (
                <li className="pdp-reviews__item" key={review.reviewId}>
                  <span className="stars" role="img" aria-label={`Rated ${review.rating} out of 5`}>
                    {reviewStarsLabel(review.rating)}
                  </span>
                  {review.title ? <p className="pdp-reviews__card-title">{review.title}</p> : null}
                  {review.body ? <p className="pdp-reviews__body">{review.body}</p> : null}
                  <p className="pdp-reviews__meta">
                    {review.displayName ?? "Customer"}
                    {review.verifiedPurchase ? " · Verified purchase" : null}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="pdp-reviews__empty">
            {reviewCount === 0 ? "No reviews yet. Be the first to share how it wears." : "Reviews will appear here once approved."}
          </p>
        )}
      </div>
    </section>
  );
}
