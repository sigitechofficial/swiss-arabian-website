"use client";

import { useState } from "react";
import { usePdpReviewList } from "@/features/catalog/hooks/usePdpReviewList";
import { useReviewActions } from "@/features/catalog/hooks/useReviewActions";
import { useReviewsCopy } from "@/features/catalog/i18n/reviewsCopy";
import type { ReviewSort, StorefrontPdpReviews, StorefrontPublicReview } from "@/features/catalog/types/pdpReviews";
import { DEFAULT_REVIEW_DISPLAY, reviewDate } from "@/features/catalog/utils/pdpReviews";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilWriteReview } from "./SapilWriteReview";
import { Button, Stars, Wrap } from "../../ui";
import { cx, SAPIL_PASTELS } from "../../ui/shared";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";

const AVATARS = ["pink", "sky", "lilac", "butter"] as const;
const SORTS: ReviewSort[] = ["useful", "newest", "rating_high", "rating_low"];
const CHIP =
  "inline-flex items-center h-[36px] px-[14px] rounded-full border text-[14px] font-[600] [transition:background_.2s,color_.2s,border-color_.2s]";
const CHIP_ON = "bg-sapil-ink text-sapil-white border-sapil-ink";
const CHIP_OFF = "bg-sapil-white border-sapil-line hover:border-sapil-ink";

/**
 * v9 `.reviews`: summary card (score, stars, count, star bars) and review
 * cards, two per row. The product's own reviews for this market (shared
 * `usePdpReviewList`); "More reviews" pages through the rest.
 */
export function PdpReviews({
  productId,
  productTitle,
  reviews,
}: {
  productId: string;
  productTitle: string;
  reviews: StorefrontPdpReviews | null | undefined;
}) {
  const t = useSapilCopy();
  const rc = useReviewsCopy();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  const [failed, setFailed] = useState(false);
  const list = usePdpReviewList(productId, reviews, { firstRow: 4, nextRow: 4, onError: () => setFailed(true) });
  const summary = reviews?.summary;
  const display = reviews?.display ?? DEFAULT_REVIEW_DISPLAY;
  const count = summary?.reviewCount ?? 0;
  const breakdown = summary?.ratingBreakdown;
  const { sort, verifiedOnly, starFilter, applyFilters } = list;
  // Written here, in a panel (as on Swiss Arabian); a guest signs in first and comes back.
  const [writing, setWriting] = useState(false);

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="pt-[40px] pb-[64px] max-900:pt-[32px] max-900:pb-[48px] scroll-mt-[96px]">
      <Wrap>
        <div className="flex justify-between items-end gap-[16px] mb-[28px] flex-wrap">
          <div>
            <span className="inline-flex items-center gap-[8px] bg-sapil-white border border-sapil-line rounded-full py-[6px] px-[14px] text-[14px] font-[600]">
              <i aria-hidden="true" className="w-[9px] h-[9px] rounded-full bg-sapil-ok-2" />
              {t("product.reviewsPill")}
            </span>
            {/* Product pages: headings only for the product's own content (SEO audit p12). */}
            <p
              id="reviews-heading"
              role="heading"
              aria-level={2}
              className="sapil-h font-sapil-sans font-[700] text-[clamp(34px,3.4vw,46px)] leading-[1.1] tracking-[-.035em] mt-[14px]"
            >
              {t("product.reviewsTitle")}
            </p>
          </div>
          <Button variant="line" onClick={() => setWriting(true)}>
            {t("product.writeReview")}
          </Button>
        </div>

        {count === 0 || !summary ? (
          <p className="border border-dashed border-sapil-line-2 rounded-sapil p-[32px] text-center text-sapil-ink-2">{t("product.noReviews")}</p>
        ) : (
          <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-[56px] items-start max-900:grid-cols-1 max-900:gap-[20px]">
            <div className="bg-sapil-white rounded-[28px] p-[30px] shadow-[0_1px_2px_rgba(60,45,30,.04),0_24px_48px_-32px_rgba(60,45,30,.3)]">
              <p className="flex items-baseline gap-[10px]">
                <b className="font-[700] text-[68px] leading-[1] tracking-[-.04em] max-900:text-[56px]">{summary.averageRating.toFixed(1)}</b>
                <span className="text-[17px] text-sapil-ink-2">{t("product.outOf5")}</span>
              </p>
              <Stars rating={summary.averageRating} size={22} className="my-[12px]" />
              <p className="text-sapil-ink-2 text-[15px]">{t("product.basedOn", { count })}</p>
              {/* A star row filters the reviews to that rating (as on Swiss Arabian). */}
              <ul className="list-none grid gap-[6px] mt-[18px] p-0" aria-label={rc.filter}>
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const c = breakdown?.[String(n) as "1"] ?? 0;
                  const on = starFilter === n;
                  return (
                    <li key={n}>
                      <button
                        type="button"
                        disabled={c === 0}
                        aria-pressed={on}
                        aria-label={rc.barLabel(n, c)}
                        onClick={() => {
                          setFailed(false);
                          applyFilters({ rating: on ? null : n });
                        }}
                        className={cx(
                          "w-full grid grid-cols-[84px_minmax(0,1fr)_34px] whitespace-nowrap items-center gap-[12px] text-[14px] rounded-[10px] py-[3px] px-[6px] -mx-[6px] text-start [transition:background_.2s] enabled:hover:bg-sapil-paper disabled:cursor-default",
                          on && "bg-sapil-paper font-[700]",
                        )}
                      >
                        <span>{t("product.starsRow", { count: n })}</span>
                        <i aria-hidden="true" className="h-[7px] rounded-full bg-sapil-line overflow-hidden">
                          <span
                            className="block h-full rounded-full bg-sapil-ok-2"
                            // A sliver keeps a row with reviews visible; a row with none stays empty.
                            style={{ width: c > 0 && count ? `max(${(c / count) * 100}%, 3px)` : "0" }}
                          />
                        </i>
                        <b className="text-end font-[500] text-sapil-ink-2">{c}</b>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[18px]">
                <div role="group" aria-label={rc.filter} className="flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    aria-pressed={!verifiedOnly && starFilter === null}
                    onClick={() => applyFilters({ verified: false, rating: null })}
                    className={cx(CHIP, !verifiedOnly && starFilter === null ? CHIP_ON : CHIP_OFF)}
                  >
                    {rc.all(count)}
                  </button>
                  {display.showVerifiedBadge && summary.verifiedPurchaseCount > 0 ? (
                    <button
                      type="button"
                      aria-pressed={verifiedOnly}
                      onClick={() => applyFilters({ verified: !verifiedOnly })}
                      className={cx(CHIP, verifiedOnly ? CHIP_ON : CHIP_OFF)}
                    >
                      {rc.verified(summary.verifiedPurchaseCount)}
                    </button>
                  ) : null}
                  {starFilter !== null ? (
                    <button
                      type="button"
                      aria-label={rc.removeStars(starFilter)}
                      onClick={() => applyFilters({ rating: null })}
                      className={cx(CHIP, CHIP_ON)}
                    >
                      {t("product.starsRow", { count: starFilter })} ✕
                    </button>
                  ) : null}
                </div>
                <label className="inline-flex items-center gap-[8px] text-[14px] text-sapil-ink-2">
                  {rc.sort}
                  <select
                    value={sort}
                    onChange={(event) => applyFilters({ sort: event.target.value as ReviewSort })}
                    className="h-[36px] rounded-full border border-sapil-line bg-sapil-white px-[12px] text-[14px] font-[600] text-sapil-ink"
                  >
                    {SORTS.map((value) => (
                      <option key={value} value={value}>
                        {rc.sorts[value]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-[20px] max-900:grid-cols-1 max-900:gap-[14px]" aria-busy={list.loading}>
                {list.visible.map((review, i) => {
                  const name = review.displayName ?? t("product.customer");
                  return (
                    <article key={review.reviewId} className="bg-sapil-white rounded-[24px] pt-[22px] px-[22px] pb-[18px] flex flex-col shadow-[0_1px_2px_rgba(60,45,30,.04)]">
                      <div className="flex items-center gap-[12px]">
                        <span
                          aria-hidden="true"
                          className="w-[40px] h-[40px] rounded-full grid place-items-center font-[700] text-[14px]"
                          style={{ background: `var(--sapil-p-${AVATARS[i % AVATARS.length] ?? SAPIL_PASTELS[0]})` }}
                        >
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <b className="block text-[16px] font-[600] leading-[1.2]">{name}</b>
                          {review.variant?.variantName ? <small className="text-[14px] text-sapil-muted">{review.variant.variantName}</small> : null}
                        </div>
                      </div>
                      <Stars rating={review.rating} size={16} className="my-[12px]" />
                      {review.title ? (
                        <p className="sapil-h font-sapil-sans font-[700] text-[18px] leading-[1.3] tracking-[-.01em] mb-[8px]">{review.title}</p>
                      ) : null}
                      {review.body ? <p className="text-[15px] leading-[1.55] text-sapil-ink-2 flex-1">{review.body}</p> : null}
                      {display.showReplies && review.reply ? (
                        <p className="mt-[12px] text-[14px] text-sapil-ink-2 border-s-2 border-sapil-line ps-[12px]">{review.reply.text}</p>
                      ) : null}
                      <div className="flex justify-between items-center mt-[18px] text-[13px] text-sapil-muted">
                        {display.showVerifiedBadge && review.verifiedPurchase ? (
                          <span className="flex items-center gap-[6px] text-sapil-ok font-[600] [&_svg]:w-[15px] [&_svg]:h-[15px]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <path d="m5 12.5 4.5 4.5L19 7.5" />
                            </svg>
                            {t("product.verifiedBuyer")}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span>{reviewDate(review.createdAt, intlLocale(locale), timeZone)}</span>
                      </div>
                      <SapilReviewActions review={review} />
                    </article>
                  );
                })}
              </div>
              {!list.visible.length && !list.loading ? (
                <p className="text-[15px] text-sapil-ink-2">{rc.noMatch}</p>
              ) : null}
              {failed ? <p role="alert" className="mt-[16px] text-[14px] text-sapil-sale">{t("product.reviewsFailed")}</p> : null}
              {list.hasMore ? (
                <div className="mt-[24px]">
                  <Button
                    variant="line"
                    disabled={list.loading}
                    aria-busy={list.loading}
                    onClick={() => {
                      setFailed(false);
                      void list.viewMore();
                    }}
                    className={cx(list.loading && "opacity-60")}
                  >
                    {t("product.moreReviews")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Wrap>
      <SapilWriteReview open={writing} onClose={() => setWriting(false)} productId={productId} productTitle={productTitle} />
    </section>
  );
}

/** "Helpful" and "Report" under a review (shared `useReviewActions`; v9 look). */
function SapilReviewActions({ review }: { review: StorefrontPublicReview }) {
  const rc = useReviewsCopy();
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const actions = useReviewActions(review, {
    anchor: "reviews",
    onError: () => setNote({ text: rc.actionFailed, error: true }),
    onReported: () => setNote({ text: rc.reportThanks }),
  });
  const link = "underline underline-offset-[3px] hover:text-sapil-ink disabled:opacity-50";
  return (
    <div className="mt-[12px] pt-[12px] border-t border-sapil-line flex flex-wrap items-center gap-x-[16px] gap-y-[6px] text-[13px] text-sapil-ink-2">
      <button
        type="button"
        aria-pressed={actions.marked}
        disabled={actions.busy}
        onClick={() => void actions.toggleHelpful()}
        className={cx(link, actions.marked && "font-[700] text-sapil-ink")}
      >
        {rc.helpful}
        {actions.count > 0 ? ` (${actions.count})` : ""}
      </button>
      {actions.reported ? (
        <span>{rc.reported}</span>
      ) : actions.confirming ? (
        <span className="inline-flex items-center gap-[10px]">
          {rc.reportAsk}
          <button type="button" disabled={actions.busy} onClick={() => void actions.sendReport()} className={cx(link, "font-[700] text-sapil-ink")}>
            {rc.yes}
          </button>
          <button type="button" onClick={() => actions.setConfirming(false)} className={link}>
            {rc.no}
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => actions.setConfirming(true)} className={link}>
          {rc.report}
        </button>
      )}
      {note ? (
        <span role={note.error ? "alert" : "status"} className={cx("basis-full", note.error ? "text-sapil-sale" : "text-sapil-ok")}>
          {note.text}
        </span>
      ) : null}
    </div>
  );
}
