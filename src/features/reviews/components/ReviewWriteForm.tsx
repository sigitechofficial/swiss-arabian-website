"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { ApiClientError } from "@/lib/api/apiError";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
} from "@/features/account/constants/accountForm";
import { findOwnReviewForProduct } from "../api/reviews.service";
import { useReviewMutations } from "../hooks/useReviewMutations";
import {
  emptyReviewFormValues,
  reviewFormSchema,
  toCreateReviewDto,
  toUpdateReviewDto,
  type ReviewFormValues,
} from "../schemas/reviewForm.schema";
import type { StorefrontCustomerReviewView } from "../types/reviews";
import {
  REVIEW_PENDING_TOAST,
  reviewWriteErrorMessage,
} from "../utils/reviewErrors";
import { StarRating } from "./StarRating";

type ReviewWriteFormProps = {
  productId: string;
  variantId?: string;
  existing?: StorefrontCustomerReviewView | null;
  onCancel?: () => void;
  onSubmitted?: (review: StorefrontCustomerReviewView) => void;
  onConflict?: (existing: StorefrontCustomerReviewView) => void;
};

export function ReviewWriteForm({
  productId,
  variantId,
  existing,
  onCancel,
  onSubmitted,
  onConflict,
}: ReviewWriteFormProps) {
  const user = useCurrentUser();
  const { create, update } = useReviewMutations();
  const isEdit = Boolean(existing);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: existing
      ? {
          rating: existing.rating,
          title: existing.title ?? "",
          body: existing.body ?? "",
          displayName: existing.displayName ?? "",
        }
      : {
          ...emptyReviewFormValues,
          displayName: user?.firstName?.trim() ?? "",
        },
  });

  const pending = create.isPending || update.isPending;

  return (
    <form
      className="flex flex-col gap-4 border border-sa-border bg-page p-5"
      onSubmit={handleSubmit(async (values) => {
        try {
          if (existing) {
            const saved = await update.unwrap({
              reviewId: existing.reviewId,
              dto: toUpdateReviewDto(values),
            });
            toast(REVIEW_PENDING_TOAST, "success");
            onSubmitted?.(saved);
            return;
          }
          const saved = await create.unwrap(
            toCreateReviewDto(values, { productId, variantId }),
          );
          toast(REVIEW_PENDING_TOAST, "success");
          onSubmitted?.(saved);
        } catch (error) {
          if (!isEdit && error instanceof ApiClientError && error.status === 409) {
            const own = await findOwnReviewForProduct(productId).catch(() => null);
            toast(reviewWriteErrorMessage(error), "info");
            if (own) onConflict?.(own);
            return;
          }
          toast(reviewWriteErrorMessage(error), "error");
        }
      })}
    >
      <div>
        <p className="mb-1.5 text-[12px] font-medium text-sa-muted">
          Rating
        </p>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <StarRating value={field.value} onChange={field.onChange} size={22} />
          )}
        />
        {errors.rating ? (
          <p className="mt-1 text-[11px] text-red-600">{errors.rating.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
          Title
        </label>
        <input
          className={accountInputClass}
          placeholder="Sum up your experience"
          maxLength={120}
          {...register("title")}
        />
        {errors.title ? (
          <p className="mt-1 text-[11px] text-red-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
          Review
        </label>
        <textarea
          className={`${accountInputClass} h-28 py-2.5`}
          placeholder="How does it wear? What did you notice?"
          maxLength={4000}
          {...register("body")}
        />
        {errors.body ? (
          <p className="mt-1 text-[11px] text-red-600">{errors.body.message}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
          Display name
        </label>
        <input
          className={accountInputClass}
          placeholder="How should we show your name?"
          maxLength={80}
          {...register("displayName")}
        />
        {errors.displayName ? (
          <p className="mt-1 text-[11px] text-red-600">
            {errors.displayName.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="submit" className={accountBtnPrimary} disabled={pending}>
          {pending
            ? "Submitting…"
            : isEdit
              ? "Save review"
              : "Submit review"}
        </button>
        {onCancel ? (
          <button
            type="button"
            className={accountBtnGhost}
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
