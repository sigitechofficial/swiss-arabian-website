"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { ApiClientError } from "@/lib/api/apiError";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
  reviewSavedToast,
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
  const t = useShopCopy();
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
            toast(reviewSavedToast(saved?.status, t), "success");
            onSubmitted?.(saved);
            return;
          }
          const saved = await create.unwrap(
            toCreateReviewDto(values, { productId, variantId }),
          );
          toast(reviewSavedToast(saved?.status, t), "success");
          onSubmitted?.(saved);
        } catch (error) {
          if (!isEdit && error instanceof ApiClientError && error.status === 409) {
            const own = await findOwnReviewForProduct(productId).catch(() => null);
            toast(reviewWriteErrorMessage(error, t), "info");
            if (own) onConflict?.(own);
            return;
          }
          toast(reviewWriteErrorMessage(error, t), "error");
        }
      })}
    >
      <div>
        <p className="mb-1.5 text-[12px] font-medium text-sa-muted">
          {t("reviewForm.rating")}
        </p>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <StarRating value={field.value} onChange={field.onChange} size={22} />
          )}
        />
        {errors.rating ? (
          <p className="mt-1 text-[11px] text-red-600">{formErrorText(t, errors.rating.message)}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
          {t("reviewForm.title")}
        </label>
        <input
          className={accountInputClass}
          placeholder={t("reviewForm.titlePlaceholder")}
          maxLength={120}
          {...register("title")}
        />
        {errors.title ? (
          <p className="mt-1 text-[11px] text-red-600">{formErrorText(t, errors.title.message)}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
          {t("reviewForm.review")}
        </label>
        <textarea
          className={`${accountInputClass} h-28 py-2.5`}
          placeholder={t("reviewForm.reviewPlaceholder")}
          maxLength={4000}
          {...register("body")}
        />
        {errors.body ? (
          <p className="mt-1 text-[11px] text-red-600">{formErrorText(t, errors.body.message)}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
          {t("reviewForm.displayName")}
        </label>
        <input
          className={accountInputClass}
          placeholder={t("reviewForm.displayNamePlaceholder")}
          maxLength={80}
          {...register("displayName")}
        />
        {errors.displayName ? (
          <p className="mt-1 text-[11px] text-red-600">
            {formErrorText(t, errors.displayName.message)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="submit" className={accountBtnPrimary} disabled={pending}>
          {pending
            ? t("reviewForm.submitting")
            : isEdit
              ? t("reviewForm.save")
              : t("reviewForm.submit")}
        </button>
        {onCancel ? (
          <button
            type="button"
            className={accountBtnGhost}
            onClick={onCancel}
            disabled={pending}
          >
            {t("account.cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
