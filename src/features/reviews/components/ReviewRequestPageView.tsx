"use client";

import { intlLocale } from "@/lib/i18n/locales";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { ApiClientError } from "@/lib/api/apiError";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import {
  fetchReviewRequest,
  type ReviewRequestProduct,
  submitReviewRequestReview,
  unsubscribeReviewEmails,
} from "../api/reviewRequests.service";
import { compositionEyebrow } from "@/styles/pdpChrome";
import * as c from "@/styles/pdpReviewsChrome";
import { pageContainer } from "@/styles/siteChrome";
import { useReviewsCopy } from "@/features/catalog/i18n/reviewsCopy";


/**
 * From the review request email: every product of the order on one page.
 * A star tapped in the email arrives pre-selected (?p=productId&r=5).
 * No sign-in — the link is the proof of purchase. ?unsubscribe=1 stops the emails.
 */
export function ReviewRequestPageView({ token }: { token: string }) {
  const params = useSearchParams();
  const t = useReviewsCopy();
  const dateLocale = intlLocale(t.locale);
  const preProduct = params.get("p");
  const preRating = Number(params.get("r")) || 0;
  const wantsUnsubscribe = params.get("unsubscribe") === "1";
  const query = useQuery({
    queryKey: ["review-request", token],
    queryFn: () => fetchReviewRequest(token),
    retry: false,
  });
  const [unsubscribed, setUnsubscribed] = useState(false);

  // Once per page load — React dev mode runs effects twice.
  const unsubscribeSent = useRef(false);
  useEffect(() => {
    if (!wantsUnsubscribe || unsubscribeSent.current) return;
    unsubscribeSent.current = true;
    unsubscribeReviewEmails(token).then(
      () => setUnsubscribed(true),
      () => toast(t.unsubscribeFailed, "error"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per page load
  }, [token, wantsUnsubscribe]);

  const data = query.data;
  const products = useMemo(() => {
    const list = data?.products ?? [];
    // The product tapped in the email first.
    return [...list].sort((a, b) => (a.productId === preProduct ? -1 : b.productId === preProduct ? 1 : 0));
  }, [data, preProduct]);

  return (
    <main className="bg-[var(--cream,#faf6ee)] py-14">
      <div className={`${pageContainer} max-w-[760px]!`}>
        {wantsUnsubscribe ? (
          <div className="mb-6 rounded-lg border border-[#e6dccb] bg-[#fffdf8] px-5 py-4 text-[0.85rem]">
            {unsubscribed ? t.unsubscribed : t.unsubscribing}
          </div>
        ) : null}
        {query.isLoading ? <p className="text-[0.9rem]">{t.loading}</p> : null}
        {query.isError ? (
          <div className={c.rvEmpty}>
            {query.error instanceof ApiClientError && query.error.status === 404
              ? t.notFound
              : t.failed}
          </div>
        ) : null}
        {data ? (
          <>
            <p className={`${compositionEyebrow} m-0`}>{t.order(data.orderNumber)}</p>
            <h1 className="mt-2 mb-2 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.1] font-light">
              {data.firstName ? t.thanks(data.firstName) : t.thanksOrder}
            </h1>
            <p className="mt-0 mb-8 text-[0.9rem] leading-[1.6] text-[var(--ink-2,#5b5148)]">
              {data.expired
                ? t.expired
                : t.rateIntro}
            </p>
            <div className="grid gap-4">
              {products.map((p) => (
                <ProductReviewCard
                  key={p.productId}
                  token={token}
                  product={p}
                  displayName={data.displayName}
                  disabled={data.expired}
                  initialRating={p.productId === preProduct ? preRating : 0}
                  onDone={() => void query.refetch()}
                />
              ))}
            </div>
            <p className="mt-8 text-center text-[0.72rem] text-[var(--ink-2,#5b5148)]">
              {t.linkUntil(new Date(data.expiresAt).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" }))}{" "}
              {!data.unsubscribed && !unsubscribed ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.72rem] underline underline-offset-2"
                  onClick={() => unsubscribeReviewEmails(token).then(() => setUnsubscribed(true))}
                >
                  {t.stopEmails}
                </button>
              ) : (
                t.noEmailsShort
              )}
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

function ProductReviewCard({
  token,
  product,
  displayName,
  disabled,
  initialRating,
  onDone,
}: {
  token: string;
  product: ReviewRequestProduct;
  displayName: string;
  disabled: boolean;
  initialRating: number;
  onDone: () => void;
}) {
  const t = useReviewsCopy();
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const image = resolveCatalogImageUrl(product.image ?? undefined);

  async function post() {
    if (rating < 1) {
      toast(t.chooseRating, "info");
      return;
    }
    setSaving(true);
    try {
      const res = await submitReviewRequestReview(token, {
        productId: product.productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        displayName: name.trim() || undefined,
      });
      setResult(res.status === "APPROVED" ? t.thanksLive : t.thanksPending);
      onDone();
    } catch (error) {
      toast(
        error instanceof ApiClientError && error.status === 409
          ? t.alreadyShort
          : t.postFailed,
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const done = product.review || result;
  return (
    <article className="rounded-lg border border-[#e6dccb] bg-[#fffdf8] p-5">
      <div className="flex items-center gap-4">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-20 flex-none bg-white object-cover" />
        ) : null}
        <div className="min-w-0">
          {product.slug ? (
            <Link href={withLocalePrefix(`/products/${product.slug}`, t.locale)} className="text-[0.85rem] tracking-[0.08em] uppercase">
              {product.name}
            </Link>
          ) : (
            <span className="text-[0.85rem] tracking-[0.08em] uppercase">{product.name}</span>
          )}
          {done ? (
            <p className="m-0 mt-1 text-[0.75rem] text-[#2e6b3f]">
              {result ?? (product.review?.status === "APPROVED" ? t.doneLive : t.donePending)}
            </p>
          ) : null}
        </div>
      </div>
      {!done && !disabled ? (
        <div className="mt-4 grid gap-3">
          <div className={c.rvPick} role="radiogroup" aria-label={t.ratingFor(product.name)}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={rating === v}
                aria-label={t.starsOf(v, t.ratings[v])}
                className={`${c.rvPickStar} ${rating >= v ? c.rvPickStarOn : c.rvPickStarOff}`}
                onClick={() => setRating(v)}
              >
                ★
              </button>
            ))}
            <span className={c.rvPickLabel}>{t.ratings[rating] ?? ""}</span>
          </div>
          {rating > 0 ? (
            <>
              <input
                className="min-h-11 rounded-lg border border-[var(--line,#d9ccb4)] bg-transparent px-3.5 text-[0.875rem]"
                placeholder={t.titleOptional}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="min-h-28 rounded-lg border border-[var(--line,#d9ccb4)] bg-transparent px-3.5 py-2.5 text-[0.875rem] leading-[1.6]"
                placeholder={t.bodyOptional}
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <label className="grid gap-1 text-[0.7rem] text-[var(--ink-2,#5b5148)]">
                {t.shownAsName}
                <input
                  className="min-h-11 rounded-lg border border-[var(--line,#d9ccb4)] bg-transparent px-3.5 text-[0.875rem] text-[var(--ink,#241f1b)]"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button type="button" className={`${c.rvBtn} max-w-[260px]`} disabled={saving} onClick={() => void post()}>
                {saving ? t.posting : t.post}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
