"use client";

import { useId } from "react";
import { toast } from "@/components/ui/Toaster";
import { MediaImage } from "@/components/ui/MediaImage";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import type { ReviewRequestProduct } from "@/features/reviews/api/reviewRequests.service";
import { useReviewRequest, useReviewRequestCard } from "@/features/reviews/hooks/useReviewRequest";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { Button, EYEBROW, Field, Serif, Wrap, cx } from "../../ui";
import { SapilLink, SapilSkeleton, useSapilDate } from "../../components/commerce/shared";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";

const RATINGS = [1, 2, 3, 4, 5] as const;
const ratingLabel = (t: SapilTranslator, value: number) =>
  value >= 1 && value <= 5 ? t(`review.rating${value as 1 | 2 | 3 | 4 | 5}`) : "";

/** Same look as the v9 checkout inputs (`.fld`), for the multi-line review text. */
const TEXTAREA =
  "min-h-[120px] w-full rounded-[14px] border border-sapil-line-2 bg-sapil-card px-[16px] py-[12px] font-sapil-sans text-[15px] font-[400] leading-[1.6] text-sapil-ink placeholder:text-[#757575] [transition:border-color_.18s,box-shadow_.18s] focus:outline-none focus:border-sapil-accent focus:shadow-[0_0_0_3px_var(--sapil-accent-soft)]";

/**
 * Sapil's `ReviewRequestPageView` (/review/[token], the link in the review
 * email): every product of the order with a star picker and a short form.
 * Logic is shared (`useReviewRequest`, `useReviewRequestCard`); this is the
 * v9 look (Gloock heading + serif accent, white cards on paper, `.fld` inputs).
 */
export function SapilReviewRequestPage({ token }: { token: string }) {
  const t = useSapilCopy();
  const date = useSapilDate();
  const request = useReviewRequest(token, {
    onUnsubscribeFailed: () => toast(t("review.unsubscribeFailed"), "error"),
  });
  const { data, products } = request;

  if (request.errorKind) {
    const missing = request.errorKind === "notFound";
    return (
      <SapilStatePanel
        title={missing ? t("review.notFoundTitle") : t("review.failedTitle")}
        accent={missing ? t("review.notFoundAccent") : t("review.failedAccent")}
        lead={missing ? t("review.notFoundLead") : t("common.loadFailed")}
        actions={
          missing ? (
            <Button href="/" LinkComponent={SapilLink}>
              {t("review.backHome")}
            </Button>
          ) : (
            <Button onClick={request.refetch}>{t("common.tryAgain")}</Button>
          )
        }
      />
    );
  }

  return (
    <Wrap as="section" className="w-full pt-[40px] pb-[88px] max-900:pt-[24px]">
      <div className="max-w-[760px] mx-auto">
        {request.wantsUnsubscribe ? (
          <p role="status" className="mb-[24px] rounded-[16px] bg-sapil-p-butter px-[20px] py-[14px] text-[14px]">
            {request.unsubscribed ? t("review.unsubscribed") : t("review.unsubscribing")}
          </p>
        ) : null}

        {!data ? (
          <div aria-busy="true" aria-label={t("review.loading")}>
            <SapilSkeleton className="h-[14px] w-[140px]" />
            <SapilSkeleton className="mt-[18px] h-[64px] w-[70%]" />
            <SapilSkeleton className="mt-[32px] h-[132px] w-full !rounded-[24px]" />
            <SapilSkeleton className="mt-[16px] h-[132px] w-full !rounded-[24px]" />
          </div>
        ) : (
          <>
            <p className={EYEBROW}>
              <span dir="ltr">{t("review.eyebrow", { number: data.orderNumber })}</span>
            </p>
            <h1 className="font-sapil-display !font-[400] text-[clamp(40px,5vw,64px)] !leading-[1] !tracking-[-.01em] mt-[14px] mb-[16px]">
              {data.firstName ? t("review.thanksName", { name: data.firstName }) : t("review.thanksOrder")}{" "}
              <Serif>{t("review.accent")}</Serif>
            </h1>
            <p className="text-[17px] text-sapil-ink-2 max-w-[52ch] mb-[32px]">
              {data.expired ? t("review.expired") : t("review.intro")}
            </p>
            <ul className="list-none grid gap-[16px]">
              {products.map((p) => (
                <li key={p.productId}>
                  <ReviewCard
                    token={token}
                    product={p}
                    displayName={data.displayName}
                    disabled={data.expired}
                    initialRating={request.initialRatingFor(p.productId)}
                    onDone={request.refetch}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-[32px] text-center text-[13px] text-sapil-muted">
              {t("review.linkUntil", { date: date(data.expiresAt, { day: "numeric", month: "short", year: "numeric" }) })}{" "}
              {!data.unsubscribed && !request.unsubscribed ? (
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-sapil-accent"
                  onClick={() => void request.unsubscribe()}
                >
                  {t("review.stopEmails")}
                </button>
              ) : (
                t("review.noEmails")
              )}
            </p>
          </>
        )}
      </div>
    </Wrap>
  );
}

function ReviewCard({
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
  const t = useSapilCopy();
  const form = useReviewRequestCard({ token, product, displayName, initialRating, onDone });
  const bodyId = useId();
  const image = resolveCatalogImageUrl(product.image ?? undefined);

  async function post() {
    const outcome = await form.submit();
    if (outcome === "needsRating") toast(t("review.chooseRating"), "info");
    else if (outcome === "already") toast(t("review.already"), "error");
    else if (outcome === "failed") toast(t("review.postFailed"), "error");
  }

  const doneText = form.posted
    ? form.posted === "live"
      ? t("review.thanksLive")
      : t("review.thanksPending")
    : form.done === "live"
      ? t("review.doneLive")
      : t("review.donePending");

  return (
    <article className="rounded-[24px] bg-sapil-white p-[20px] shadow-sapil max-600:p-[16px]">
      <div className="flex items-center gap-[16px]">
        <span className="relative grid size-[80px] flex-none place-items-center overflow-hidden rounded-[16px] bg-sapil-p-sand">
          {image ? (
            <MediaImage src={image} alt="" fill sizes="80px" className="object-contain p-[6px]" />
          ) : null}
        </span>
        <div className="min-w-0">
          {product.slug ? (
            <SapilLink href={`/products/${product.slug}`} className="font-[600] text-[16px] hover:underline">
              {product.name}
            </SapilLink>
          ) : (
            <span className="font-[600] text-[16px]">{product.name}</span>
          )}
          {form.done ? <p className="mt-[4px] text-[13px] font-[500] text-sapil-ok">{doneText}</p> : null}
        </div>
      </div>
      {!form.done && !disabled ? (
        <div className="mt-[16px] grid gap-[14px]">
          <div
            role="radiogroup"
            aria-label={t("review.ratingFor", { name: product.name })}
            className="flex items-center gap-[4px]"
          >
            {RATINGS.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={form.rating === v}
                aria-label={t("review.starsOf", { count: v, label: ratingLabel(t, v) })}
                className={cx(
                  "grid size-[40px] place-items-center rounded-full text-[26px] leading-none [transition:transform_.18s_var(--sapil-ease),color_.18s] hover:[transform:scale(1.1)]",
                  form.rating >= v ? "text-sapil-star" : "text-sapil-line-2",
                )}
                onClick={() => form.setRating(v)}
              >
                <span aria-hidden="true">★</span>
              </button>
            ))}
            <span className="ms-[8px] text-[14px] font-[500] text-sapil-ink-2">{ratingLabel(t, form.rating)}</span>
          </div>
          {form.rating > 0 ? (
            <>
              <Field
                label={t("review.title")}
                optional={t("review.optional")}
                maxLength={120}
                value={form.title}
                onChange={(e) => form.setTitle(e.target.value)}
              />
              <div className="flex flex-col gap-[6px] text-[14px] font-[500]">
                <label htmlFor={bodyId}>
                  {t("review.body")}{" "}
                  <small className="font-[400] [font-size:smaller] text-sapil-muted">{t("review.optional")}</small>
                </label>
                <textarea
                  id={bodyId}
                  className={TEXTAREA}
                  maxLength={2000}
                  value={form.body}
                  onChange={(e) => form.setBody(e.target.value)}
                />
              </div>
              <Field
                label={t("review.shownAs")}
                maxLength={80}
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
              />
              <Button className="justify-self-start" disabled={form.saving} onClick={() => void post()}>
                {form.saving ? t("review.posting") : t("review.post")}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
