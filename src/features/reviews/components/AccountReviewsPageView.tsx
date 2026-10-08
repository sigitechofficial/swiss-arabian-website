"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageLoading } from "@/components/ui";
import { toast } from "@/components/ui/Toaster";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import {
  AccountStatusPill,
  type AccountStatusTone,
} from "@/features/account/components/AccountStatus";
import { accountBtnGhost } from "@/features/account/constants/accountForm";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useMyReviewsFeed } from "../hooks/useProductReviews";
import { useReviewMutations } from "../hooks/useReviewMutations";
import type { StorefrontCustomerReviewView } from "../types/reviews";
import { ReviewWriteForm } from "./ReviewWriteForm";
import { StarRating } from "./StarRating";

const FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function statusTone(status: string): AccountStatusTone {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "DELETED":
      return "danger";
    default:
      return "muted";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "HIDDEN":
      return "Hidden";
    case "DELETED":
      return "Deleted";
    default:
      return status;
  }
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AccountReviewsPageView() {
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const feed = useMyReviewsFeed(status);
  const { remove } = useReviewMutations();

  const items = useMemo(
    () => feed.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.data],
  );

  const emptyCopy = useMemo(() => {
    if (status === "PENDING") return "No reviews waiting for approval.";
    if (status === "APPROVED") return "No published reviews yet.";
    if (status === "REJECTED") return "No rejected reviews.";
    return "You have not reviewed a product yet.";
  }, [status]);

  return (
    <AccountPageShell>
      <AccountPageTitle
        title="Reviews"
        subtitle="Reviews appear on the product page after approval. Editing sends them back for review."
      />

      <div className={`${accountContainer} pb-16`}>
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = status === filter.value;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setEditingId(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  active
                    ? "bg-terra text-white"
                    : "border border-sa-border text-sa-secondary hover:border-terra hover:text-terra"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {feed.isLoading && items.length === 0 ? (
          <PageLoading label="Loading reviews…" />
        ) : feed.isError && items.length === 0 ? (
          <p className="text-[14px] text-sa-secondary">
            Your reviews could not be loaded right now.
          </p>
        ) : items.length === 0 ? (
          <p className="text-[14px] text-sa-secondary">{emptyCopy}</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {items.map((review) => (
              <li
                key={review.reviewId}
                className="border border-sa-border p-5"
              >
                <AccountReviewCard
                  review={review}
                  editing={editingId === review.reviewId}
                  deleting={remove.isPending}
                  onEdit={() => setEditingId(review.reviewId)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                  onDelete={async () => {
                    if (
                      !window.confirm(
                        "Remove this review? This cannot be undone.",
                      )
                    ) {
                      return;
                    }
                    try {
                      await remove.unwrap(review.reviewId);
                      toast("Review removed", "success");
                      setEditingId(null);
                    } catch (error) {
                      toast(getUserFacingErrorMessage(error), "error");
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        {feed.hasNextPage ? (
          <button
            type="button"
            className={`${accountBtnGhost} mt-6`}
            disabled={feed.isFetchingNextPage}
            onClick={() => void feed.fetchNextPage()}
          >
            {feed.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </AccountPageShell>
  );
}

function AccountReviewCard({
  review,
  editing,
  deleting,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
}: {
  review: StorefrontCustomerReviewView;
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const name = review.product?.name || "Product";
  const slug = review.product?.slug;
  const image = resolveCatalogImageUrl(review.product?.image);
  const date = formatReviewDate(review.updatedAt || review.createdAt);

  return (
    <article>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {image ? (
          <div className="relative size-[72px] shrink-0 overflow-hidden border border-sa-border bg-section-soft">
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="72px"
              unoptimized
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {slug ? (
              <Link
                href={`/products/${slug}`}
                className="text-[15px] font-semibold text-sa-primary hover:text-terra"
              >
                {name}
              </Link>
            ) : (
              <p className="text-[15px] font-semibold text-sa-primary">{name}</p>
            )}
            <AccountStatusPill
              label={statusLabel(review.status)}
              tone={statusTone(review.status)}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StarRating value={review.rating} readOnly size={14} />
            {date ? (
              <span className="text-[12px] text-sa-muted">{date}</span>
            ) : null}
            {review.verifiedPurchase ? (
              <span className="text-[12px] font-semibold text-terra">
                Verified purchase
              </span>
            ) : null}
          </div>
          {review.status === "PENDING" ? (
            <p className="mt-2 text-[13px] text-sa-secondary">
              Waiting for approval — not shown on the product page yet.
            </p>
          ) : null}
          {review.status === "REJECTED" ? (
            <p className="mt-2 text-[13px] text-sa-secondary">
              This review was not published.
            </p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="mt-5">
          <ReviewWriteForm
            productId={review.productId}
            variantId={review.variantId ?? undefined}
            existing={review}
            onCancel={onCancelEdit}
            onSubmitted={onSaved}
          />
        </div>
      ) : (
        <>
          {review.title ? (
            <h3 className="mt-4 text-[15px] font-semibold text-sa-primary">
              {review.title}
            </h3>
          ) : null}
          {review.body ? (
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-sa-secondary">
              {review.body}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={accountBtnGhost} onClick={onEdit}>
              Edit
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md px-4 text-[13px] font-semibold text-[#b4483f] hover:underline disabled:opacity-50"
              onClick={onDelete}
              disabled={deleting}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </article>
  );
}
