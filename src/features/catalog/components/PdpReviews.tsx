"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SideSheet } from "@/components/ui/SideSheet";
import { toast } from "@/components/ui/Toaster";
import { ApiClientError } from "@/lib/api/apiError";
import { toastApiError } from "@/lib/api/toastApiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useReviewsCopy } from "../i18n/reviewsCopy";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import {
  createCustomerReview,
  fetchProductReviews,
  markReviewHelpful,
  reportReview,
} from "../api/reviews.service";
import { writeReviewSchema, type WriteReviewValues } from "../schemas/review.schema";
import type {
  ReviewSort,
  StorefrontPdpReviews,
  StorefrontPublicReview,
} from "../types/pdpReviews";
import { DEFAULT_REVIEW_DISPLAY, reviewDate, reviewStarsLabel } from "../utils/pdpReviews";
import {
  compositionEm,
  compositionEyebrow,
  reviews as reviewsSection,
  reviewsCopy,
  reviewsHead,
  reviewsTitle,
} from "@/styles/pdpChrome";
import * as c from "@/styles/pdpReviewsChrome";
import { fld, fldFull } from "@/styles/checkoutChrome";
import { stars } from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";

const FIRST_ROW = 3;
const NEXT_ROW = 4;
const SORTS: ReviewSort[] = ["useful", "newest", "rating_high", "rating_low"];

function Stars({ rating, size = "0.7rem" }: { rating: number; size?: string }) {
  const t = useReviewsCopy();
  return (
    <span className={stars} style={{ fontSize: size }} role="img" aria-label={t.rated(rating)}>
      {reviewStarsLabel(rating)}
    </span>
  );
}

function Who({ review, showBadge }: { review: StorefrontPublicReview; showBadge: boolean }) {
  const t = useReviewsCopy();
  return (
    <div className={c.rvWho}>
      <span>{review.displayName ?? t.customer}</span>
      {showBadge && review.verifiedPurchase ? (
        <span className={c.rvVerified}>
          <span className={c.rvVerifiedDot} aria-hidden="true">✓</span>
          {t.verifiedBuyer}
        </span>
      ) : null}
    </div>
  );
}

/**
 * "Helpful" and "Report" under a review. Signed-in customers only (one vote each);
 * guests are sent to sign in and come back to the reviews.
 */
function ReviewActions({ review }: { review: StorefrontPublicReview }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const t = useReviewsCopy();
  const [count, setCount] = useState(review.helpfulCount);
  const [marked, setMarked] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const needSignIn = () => {
    if (isAuthenticated) return false;
    router.push(`/login?returnTo=${encodeURIComponent(`${pathname}#pdp-reviews`)}`);
    return true;
  };
  const toggleHelpful = async () => {
    if (needSignIn() || busy) return;
    setBusy(true);
    try {
      const next = await markReviewHelpful(review.reviewId, !marked);
      setMarked(!marked);
      setCount((n) => next ?? Math.max(0, n + (marked ? -1 : 1)));
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };
  const sendReport = async () => {
    if (needSignIn() || busy) return;
    setBusy(true);
    try {
      await reportReview(review.reviewId);
      setReported(true);
      setConfirming(false);
      toast(t.reportThanks, "success");
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={c.rvActions}>
      <button
        type="button"
        className={`${c.rvAction} ${marked ? c.rvActionOn : ""}`}
        aria-pressed={marked}
        disabled={busy}
        onClick={() => void toggleHelpful()}
      >
        {t.helpful}{count > 0 ? ` (${count})` : ""}
      </button>
      {reported ? (
        <span>{t.reported}</span>
      ) : confirming ? (
        <span className="inline-flex items-center gap-2">
          {t.reportAsk}
          <button type="button" className={`${c.rvAction} ${c.rvActionOn}`} disabled={busy} onClick={() => void sendReport()}>
            {t.yes}
          </button>
          <button type="button" className={c.rvAction} onClick={() => setConfirming(false)}>
            {t.no}
          </button>
        </span>
      ) : (
        <button type="button" className={c.rvAction} onClick={() => setConfirming(true)}>
          {t.report}
        </button>
      )}
    </div>
  );
}

/**
 * Product page reviews (Option C): overall stats in the first column, the most
 * useful reviews in the other three; "View more" adds rows of four. Reviews are
 * this market's only (Admin → Reviews → Settings), with Swiss Arabian's replies.
 */
export function PdpReviews({
  productId,
  productTitle,
  productImage,
  variantId,
  reviews,
}: {
  productId: string;
  productTitle: string;
  productImage?: string | null;
  variantId?: string;
  reviews: StorefrontPdpReviews | null | undefined;
}) {
  const market = useSelectedCatalogMarket();
  const t = useReviewsCopy();
  const summary = reviews?.summary;
  const display = reviews?.display ?? DEFAULT_REVIEW_DISPLAY;
  const reviewCount = summary?.reviewCount ?? 0;

  const [sort, setSort] = useState<ReviewSort>(reviews?.sort ?? "useful");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [items, setItems] = useState<StorefrontPublicReview[]>(reviews?.items ?? []);
  const [total, setTotal] = useState(reviews?.total ?? 0);
  const [shown, setShown] = useState(FIRST_ROW);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<StorefrontPublicReview | null>(null);
  const [writing, setWriting] = useState(false);

  async function load(next: { sort: ReviewSort; verified: boolean; rating: number | null }, offset = 0) {
    setLoading(true);
    try {
      const page = await fetchProductReviews(
        productId,
        { sort: next.sort, verified: next.verified, rating: next.rating, offset, limit: 24 },
        market,
      );
      setItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.total);
    } catch (error) {
      toastApiError(error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(next: { sort?: ReviewSort; verified?: boolean; rating?: number | null }) {
    const value = {
      sort: next.sort ?? sort,
      verified: next.verified ?? verifiedOnly,
      rating: next.rating === undefined ? starFilter : next.rating,
    };
    setSort(value.sort);
    setVerifiedOnly(value.verified);
    setStarFilter(value.rating);
    setShown(FIRST_ROW);
    void load(value);
  }

  async function viewMore() {
    const nextShown = shown + NEXT_ROW;
    if (nextShown > items.length && items.length < total) {
      await load({ sort, verified: verifiedOnly, rating: starFilter }, items.length);
    }
    setShown(nextShown);
  }

  const visible = items.slice(0, shown);
  const breakdown = summary?.ratingBreakdown;

  return (
    <section className={reviewsSection} id="pdp-reviews" aria-labelledby="pdp-reviews-heading">
      <div className={pageContainer}>
        <header className={reviewsHead}>
          <div className={reviewsCopy}>
            <p className={compositionEyebrow}>{t.eyebrow}</p>
            <h2 className={reviewsTitle} id="pdp-reviews-heading">
              {t.titleA}<em className={compositionEm}>{t.titleB}</em>
            </h2>
          </div>
        </header>

        {reviewCount === 0 ? (
          <div className={c.rvEmpty}>
            <p className="m-0 mb-4">{t.none}</p>
            <button type="button" className={c.rvBtnLine} onClick={() => setWriting(true)}>
              {t.writeFirst}
            </button>
          </div>
        ) : (
          <div className={c.rvGrid}>
            <aside className={c.rvSummary} aria-label={t.overall}>
              <div className={c.rvAvg}>
                <span className={c.rvAvgNum}>{summary!.averageRating.toFixed(1)}</span>
                <Stars rating={summary!.averageRating} size="1rem" />
              </div>
              <p className={c.rvCount}>
                {t.count(reviewCount)}
                {display.marketOnly ? t.inMarket : ""}
                {display.showVerifiedBadge && summary!.verifiedPurchaseCount > 0 ? (
                  <>
                    <br />
                    {t.fromVerified(summary!.verifiedPurchaseCount)}
                  </>
                ) : null}
              </p>
              <div className={c.rvBars}>
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const count = breakdown?.[String(n) as "1"] ?? 0;
                  const on = starFilter === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`${c.rvBar} ${on ? c.rvBarOn : ""}`}
                      disabled={count === 0}
                      aria-pressed={on}
                      aria-label={t.barLabel(n, count)}
                      onClick={() => applyFilters({ rating: on ? null : n })}
                    >
                      <span>{n} ★</span>
                      <span className={c.rvBarTrack}>
                        <span className={c.rvBarFill} style={{ width: `${(count / reviewCount) * 100}%` }} />
                      </span>
                      <span className={c.rvBarN}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className={c.rvBtn} onClick={() => setWriting(true)}>
                {t.write}
              </button>
              <p className={c.rvNote}>
                {display.showVerifiedBadge ? t.verifiedNote : ""}
                {t.honestNote}
              </p>
            </aside>

            <div className={c.rvTools}>
              <div className={c.rvChips} role="group" aria-label={t.filter}>
                <button
                  type="button"
                  className={`${c.rvChip} ${!verifiedOnly && starFilter === null ? c.rvChipOn : ""}`}
                  onClick={() => applyFilters({ verified: false, rating: null })}
                >
                  {t.all(reviewCount)}
                </button>
                {display.showVerifiedBadge && summary!.verifiedPurchaseCount > 0 ? (
                  <button
                    type="button"
                    className={`${c.rvChip} ${verifiedOnly ? c.rvChipOn : ""}`}
                    onClick={() => applyFilters({ verified: !verifiedOnly })}
                  >
                    {t.verified(summary!.verifiedPurchaseCount)}
                  </button>
                ) : null}
                {starFilter !== null ? (
                  <button
                    type="button"
                    className={`${c.rvChip} ${c.rvChipOn}`}
                    onClick={() => applyFilters({ rating: null })}
                    aria-label={t.removeStars(starFilter)}
                  >
                    {starFilter} ★ ✕
                  </button>
                ) : null}
              </div>
              <label className={c.rvSort}>
                {t.sort}
                <select value={sort} onChange={(e) => applyFilters({ sort: e.target.value as ReviewSort })}>
                  {SORTS.map((s) => (
                    <option key={s} value={s}>
                      {t.sorts[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visible.map((review) => {
              const long = (review.body?.length ?? 0) > 220;
              const hasReply = display.showReplies && review.reply;
              return (
                <article key={review.reviewId} className={c.rvCard}>
                  <div className={c.rvCardTop}>
                    <Stars rating={review.rating} />
                    <span className={c.rvDate}>{reviewDate(review.createdAt, t.locale === "ar" ? "ar" : "en-GB")}</span>
                  </div>
                  {review.title ? <h3 className={c.rvTitle}>{review.title}</h3> : null}
                  {review.body ? <p className={c.rvBody}>{review.body}</p> : null}
                  {review.photos.length ? (
                    <ReviewPhotoThumbs review={review} onOpen={() => setReading(review)} />
                  ) : null}
                  {hasReply ? (
                    <div className={c.rvReply}>
                      <span className={c.rvReplyLabel}>{t.replied}</span>
                      <span className={c.rvReplyText}>{review.reply!.text}</span>
                    </div>
                  ) : null}
                  {long || hasReply ? (
                    <button type="button" className={c.rvMore} onClick={() => setReading(review)}>
                      {t.readMore}
                    </button>
                  ) : null}
                  <Who review={review} showBadge={display.showVerifiedBadge} />
                  <ReviewActions review={review} />
                </article>
              );
            })}

            {!visible.length && !loading ? (
              <p className="m-0 text-[0.85rem] text-[var(--ink-2,#5b5148)] min-[900px]:col-span-3">
                {t.noMatch}
              </p>
            ) : null}

            <div className={c.rvFoot}>
              <p className={c.rvFootCount} aria-live="polite">
                {loading ? t.loading : t.showing(Math.min(shown, total), total)}
              </p>
              {shown < total ? (
                <button type="button" className={c.rvBtnLine} disabled={loading} onClick={() => void viewMore()}>
                  {t.viewMore}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {reading ? (
        <ReadReview review={reading} productTitle={productTitle} showBadge={display.showVerifiedBadge} showReply={display.showReplies} onClose={() => setReading(null)} />
      ) : null}

      <WriteReviewPanel
        open={writing}
        onClose={() => setWriting(false)}
        productId={productId}
        productTitle={productTitle}
        productImage={productImage}
        variantId={variantId}
        zoneCode={market?.zoneCode ?? null}
      />
    </section>
  );
}

/** Up to 3 customer photos on a review card; the third shows "+N" when there are more. */
function ReviewPhotoThumbs({
  review,
  onOpen,
}: {
  review: StorefrontPublicReview;
  onOpen: () => void;
}) {
  const t = useReviewsCopy();
  const photos = review.photos;
  const shown = photos.slice(0, 3);
  const extra = photos.length - shown.length;
  return (
    <div className={c.rvPhotos} role="group" aria-label={t.openPhotos(photos.length)}>
      {shown.map((p, i) => (
        <button
          key={p.id}
          type="button"
          className={c.rvPhoto}
          onClick={onOpen}
          aria-label={t.photoOf(i + 1, photos.length)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- customer photos come from the review host as-is */}
          <img src={p.url} alt="" className={c.rvPhotoImg} loading="lazy" />
          {i === shown.length - 1 && extra > 0 ? (
            <span className={c.rvPhotoMore} aria-hidden>
              {t.morePhotos(extra)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function ReadReview({
  review,
  productTitle,
  showBadge,
  showReply,
  onClose,
}: {
  review: StorefrontPublicReview;
  productTitle: string;
  showBadge: boolean;
  showReply: boolean;
  onClose: () => void;
}) {
  const t = useReviewsCopy();
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return createPortal(
    <div className={c.rvDialogWrap}>
      <button type="button" className={c.rvDialogScrim} aria-label={t.close} onClick={onClose} />
      <div className={c.rvDialog} role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
        <button type="button" className={c.rvDialogClose} onClick={onClose} aria-label={t.close} autoFocus>
          ×
        </button>
        <p className={`${compositionEyebrow} m-0 mb-2.5`} id="review-dialog-title">
          {t.reviewOf(productTitle)}
        </p>
        <div className="mb-2.5 flex items-center gap-3">
          <Stars rating={review.rating} size="0.85rem" />
          <span className={c.rvDate}>{reviewDate(review.createdAt, t.locale === "ar" ? "ar" : "en-GB")}</span>
        </div>
        {review.title ? <h3 className="m-0 mb-2 text-[1.05rem] font-semibold">{review.title}</h3> : null}
        {review.body ? <p className={c.rvDialogBody}>{review.body}</p> : null}
        {review.photos.length ? (
          <div className={c.rvDialogPhotos}>
            {review.photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- customer photos come from the review host as-is
              <img
                key={p.id}
                src={p.url}
                alt={p.alt ?? t.photoOf(i + 1, review.photos.length)}
                className={c.rvDialogPhoto}
                loading="lazy"
              />
            ))}
          </div>
        ) : null}
        {showReply && review.reply ? (
          <div className={`${c.rvReply} mt-4 text-[0.82rem]`}>
            <span className={c.rvReplyLabel}>{t.replied}</span>
            {review.reply.text}
          </div>
        ) : null}
        <div className="mt-4">
          <Who review={review} showBadge={showBadge} />
          <div className="mt-2">
            <ReviewActions review={review} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WriteReviewPanel({
  open,
  onClose,
  productId,
  productTitle,
  productImage,
  variantId,
  zoneCode,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  productImage?: string | null;
  variantId?: string;
  zoneCode: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const t = useReviewsCopy();
  const [submitting, setSubmitting] = useState(false);
  const defaultName = useMemo(
    () => user?.fullName?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "",
    [user],
  );
  const form = useForm<WriteReviewValues>({
    resolver: zodResolver(writeReviewSchema),
    defaultValues: { rating: 5, title: "", body: "", name: defaultName, honest: true },
  });
  const rating = useWatch({ control: form.control, name: "rating" });
  const body = useWatch({ control: form.control, name: "body" }) ?? "";

  useEffect(() => {
    if (open && !isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(`${pathname}#pdp-reviews`)}`);
      onClose();
    }
    if (open && defaultName && !form.getValues("name")) form.setValue("name", defaultName);
  }, [open, isAuthenticated, defaultName, form, onClose, pathname, router]);

  const onSubmit = async (values: WriteReviewValues) => {
    setSubmitting(true);
    try {
      const result = await createCustomerReview(
        {
          productId,
          rating: values.rating,
          title: values.title?.trim() || undefined,
          body: values.body.trim(),
          displayName: values.name.trim(),
          variantId,
        },
        zoneCode,
      );
      form.reset({ rating: 5, title: "", body: "", name: values.name, honest: true });
      onClose();
      toast(
        result.status === "APPROVED" ? t.live : t.pending,
        "success",
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
        return;
      }
      if (error instanceof ApiClientError && error.status === 409) {
        toast(t.already, "info");
        return;
      }
      if (error instanceof ApiClientError && (error.status === 422 || error.status === 400)) {
        toast(t.notBought, "info");
        return;
      }
      toastApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SideSheet open={open && isAuthenticated} onClose={onClose} label={t.write}>
      <form className={c.rvPanel} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className={c.rvPanelHead}>
          {productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={productImage} alt="" className="size-16 flex-none bg-white object-cover" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={`${compositionEyebrow} m-0`}>{t.write}</p>
            <p className={c.rvPanelTitle}>{productTitle}</p>
          </div>
          <button type="button" className="cursor-pointer border-0 bg-transparent text-[1.5rem] leading-none text-[var(--ink-2,#5b5148)]" onClick={onClose} aria-label={t.close}>
            ×
          </button>
        </div>
        <div className={c.rvPanelBody}>
          <div className={fld}>
            <span>{t.yourRating}</span>
            <div className={c.rvPick} role="radiogroup" aria-label={t.yourRating}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={t.starsOf(value, t.ratings[value])}
                  className={`${c.rvPickStar} ${rating >= value ? c.rvPickStarOn : c.rvPickStarOff}`}
                  onClick={() => form.setValue("rating", value, { shouldValidate: true })}
                >
                  ★
                </button>
              ))}
              <span className={c.rvPickLabel}>{t.ratings[rating] ?? ""}</span>
            </div>
          </div>
          <label className={fld}>
            <span>{t.titleOptional}</span>
            <input type="text" placeholder={t.titleExample} {...form.register("title")} />
          </label>
          <label className={fldFull}>
            <span>{t.yourReview}</span>
            <textarea
              rows={5}
              placeholder={t.bodyHint}
              aria-invalid={Boolean(form.formState.errors.body)}
              {...form.register("body")}
            />
            <span className={c.rvHint}>
              <span>{form.formState.errors.body?.message ?? t.minChars}</span>
              <span>{body.length} / 2,000</span>
            </span>
          </label>
          <label className={fld}>
            <span>{t.shownAs}</span>
            <input type="text" autoComplete="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
            <span className={c.rvSmall}>
              {form.formState.errors.name?.message ?? t.nameHint}
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-[0.72rem] leading-[1.55] text-[var(--ink-2,#5b5148)]">
            <input type="checkbox" className="mt-0.5 accent-copper" {...form.register("honest")} />
            <span>{t.honest}</span>
          </label>
          {form.formState.errors.honest ? <span className={c.rvErr}>{form.formState.errors.honest.message}</span> : null}
          <button className={c.rvBtn} type="submit" disabled={submitting}>
            {submitting ? t.posting : t.post}
          </button>
          <p className={c.rvSmall}>
            {t.panelNote}
          </p>
        </div>
      </form>
    </SideSheet>
  );
}
