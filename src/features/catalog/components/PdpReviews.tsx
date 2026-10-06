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
import {
  compositionEm,
  compositionEyebrow,
  reviewErr,
  reviewFoot,
  reviewForm,
  reviewGrid,
  reviewIntro,
  reviewRating,
  reviewStar,
  reviewStarOn,
  reviewSubmit,
  reviews as reviewsSection,
  reviewsActions,
  reviewsBody,
  reviewsCardTitle,
  reviewsCopy,
  reviewsEmpty,
  reviewsHead,
  reviewsItem,
  reviewsList,
  reviewsMeta,
  reviewsNav,
  reviewsTitle,
  reviewsWrite,
} from "@/styles/pdpChrome";
import { fld, fldFull } from "@/styles/checkoutChrome";
import { stars } from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";

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
    const card = el.querySelector("li");
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
    <section className={reviewsSection} id="pdp-reviews" aria-labelledby="pdp-reviews-heading">
      <div className={pageContainer}>
        <header className={reviewsHead}>
          <div className={reviewsCopy}>
            <p className={compositionEyebrow}>Customer reviews</p>
            <h2 className={reviewsTitle} id="pdp-reviews-heading">
              What customers <em className={compositionEm}>say.</em>
            </h2>
          </div>
          <div className={reviewsActions}>
            {items.length > 1 ? (
              <div className={reviewsNav}>
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
            <button type="button" className={reviewsWrite} onClick={toggleWrite}>
              {open ? "Close" : "Write a review"}
            </button>
          </div>
        </header>

        {open ? (
          <form className={reviewForm} noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className={reviewIntro}>
              <h3>Write a review</h3>
              <p>Share how {productTitle} wears on you. It appears after approval.</p>
            </div>
            <div className={reviewGrid}>
              <label className={fld}>
                <span>Overall rating</span>
                <div className={reviewRating} role="radiogroup" aria-label="Overall rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={rating >= value ? `${reviewStar} ${reviewStarOn}` : reviewStar}
                      aria-checked={rating === value}
                      role="radio"
                      onClick={() => form.setValue("rating", value, { shouldValidate: true })}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {form.formState.errors.rating ? (
                  <span className={reviewErr}>{form.formState.errors.rating.message}</span>
                ) : null}
              </label>
              <label className={fld}>
                <span>Review title</span>
                <input type="text" placeholder="A signature, not a trend" {...form.register("title")} />
                {form.formState.errors.title ? (
                  <span className={reviewErr}>{form.formState.errors.title.message}</span>
                ) : null}
              </label>
              <label className={fldFull}>
                <span>Your review</span>
                <textarea rows={5} placeholder="Longevity, sillage, when you wear it…" {...form.register("body")} />
                {form.formState.errors.body ? (
                  <span className={reviewErr}>{form.formState.errors.body.message}</span>
                ) : null}
              </label>
              <label className={fld}>
                <span>Display name</span>
                <input type="text" autoComplete="name" placeholder="Amira K." {...form.register("name")} />
                {form.formState.errors.name ? (
                  <span className={reviewErr}>{form.formState.errors.name.message}</span>
                ) : null}
              </label>
            </div>
            <div className={reviewFoot}>
              <p>By submitting, you confirm this is your own experience with the fragrance.</p>
              <button className={reviewSubmit} type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </form>
        ) : null}

        {items.length ? (
          <div className="min-w-0">
            <ul className={reviewsList} ref={scrollerRef} role="list">
              {items.map((review) => (
                <li className={reviewsItem} key={review.reviewId}>
                  <span className={`${stars} text-[0.62rem]`} role="img" aria-label={`Rated ${review.rating} out of 5`}>
                    {reviewStarsLabel(review.rating)}
                  </span>
                  {review.title ? <p className={reviewsCardTitle}>{review.title}</p> : null}
                  {review.body ? <p className={reviewsBody}>{review.body}</p> : null}
                  <p className={reviewsMeta}>
                    {review.displayName ?? "Customer"}
                    {review.verifiedPurchase ? " · Verified purchase" : null}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={reviewsEmpty}>
            {reviewCount === 0 ? "No reviews yet. Be the first to share how it wears." : "Reviews will appear here once approved."}
          </p>
        )}
      </div>
    </section>
  );
}
