"use client";

import { useState } from "react";
import { usePdpReviewList } from "@/features/catalog/hooks/usePdpReviewList";
import type { StorefrontPdpReviews } from "@/features/catalog/types/pdpReviews";
import { DEFAULT_REVIEW_DISPLAY, reviewDate } from "@/features/catalog/utils/pdpReviews";
import { useIsAuthenticated } from "@/hooks/useCurrentUser";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Stars, Wrap } from "../../ui";
import { cx, SAPIL_PASTELS } from "../../ui/shared";
import { SapilLocaleLink } from "../product/SapilLocaleLink";

const AVATARS = ["pink", "sky", "lilac", "butter"] as const;

/**
 * v9 `.reviews`: summary card (score, stars, count, star bars) and review
 * cards, two per row. The product's own reviews for this market (shared
 * `usePdpReviewList`); "More reviews" pages through the rest.
 */
export function PdpReviews({
  productId,
  reviews,
}: {
  productId: string;
  reviews: StorefrontPdpReviews | null | undefined;
}) {
  const t = useSapilCopy();
  const locale = useShopLocale();
  const signedIn = useIsAuthenticated();
  const [failed, setFailed] = useState(false);
  const list = usePdpReviewList(productId, reviews, { firstRow: 4, nextRow: 4, onError: () => setFailed(true) });
  const summary = reviews?.summary;
  const display = reviews?.display ?? DEFAULT_REVIEW_DISPLAY;
  const count = summary?.reviewCount ?? 0;
  const breakdown = summary?.ratingBreakdown;
  // Writing a review happens from the shopper's account (orders → review); guests sign in first.
  const writeHref = signedIn ? "/account/reviews" : `/login?returnTo=${encodeURIComponent("/account/reviews")}`;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="pt-[40px] pb-[64px] max-900:pt-[32px] max-900:pb-[48px] scroll-mt-[96px]">
      <Wrap>
        <div className="flex justify-between items-end gap-[16px] mb-[28px] flex-wrap">
          <div>
            <span className="inline-flex items-center gap-[8px] bg-sapil-white border border-sapil-line rounded-full py-[6px] px-[14px] text-[14px] font-[600]">
              <i aria-hidden="true" className="w-[9px] h-[9px] rounded-full bg-sapil-ok-2" />
              {t("product.reviewsPill")}
            </span>
            <h2
              id="reviews-heading"
              className="font-sapil-sans font-[700] text-[clamp(34px,3.4vw,46px)] leading-[1.1] tracking-[-.035em] mt-[14px]"
            >
              {t("product.reviewsTitle")}
            </h2>
          </div>
          <Button variant="line" href={writeHref} LinkComponent={SapilLocaleLink}>
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
              <ul className="list-none grid gap-[12px] mt-[22px] p-0">
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const c = breakdown?.[String(n) as "1"] ?? 0;
                  return (
                    <li key={n} className="grid grid-cols-[62px_1fr_34px] items-center gap-[12px] text-[14px]">
                      <span>{t("product.starsRow", { count: n })}</span>
                      <i aria-hidden="true" className="h-[7px] rounded-full bg-sapil-line overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-sapil-ok-2"
                          style={{ width: `max(${count ? (c / count) * 100 : 0}%, 3px)` }}
                        />
                      </i>
                      <b className="text-end font-[500] text-sapil-ink-2">{c}</b>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-[20px] max-900:grid-cols-1 max-900:gap-[14px]">
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
                        <h3 className="font-sapil-sans font-[700] text-[18px] leading-[1.3] tracking-[-.01em] mb-[8px]">{review.title}</h3>
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
                        <span>{reviewDate(review.createdAt, intlLocale(locale))}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
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
    </section>
  );
}
