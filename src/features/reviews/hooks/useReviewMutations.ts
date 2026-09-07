"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/lib/api/queryHooks";
import { reviewsKeys } from "../api/reviews.keys";
import {
  createReview,
  deleteReview,
  markReviewHelpful,
  removeReviewHelpful,
  updateReview,
} from "../api/reviews.service";
import type { CreateReviewDto, UpdateReviewDto } from "../types/reviews";
import { useReviewZoneCode } from "./useProductReviews";

export function useReviewMutations() {
  const queryClient = useQueryClient();
  const zoneCode = useReviewZoneCode();

  const invalidateMine = () =>
    queryClient.invalidateQueries({ queryKey: reviewsKeys.mine() });

  const invalidatePublic = () =>
    queryClient.invalidateQueries({ queryKey: reviewsKeys.public() });

  const create = useApiMutation(
    (dto: CreateReviewDto) => createReview(dto, zoneCode),
    {
      onSuccess: async () => {
        await invalidateMine();
      },
    },
  );

  const update = useApiMutation(
    (vars: { reviewId: string; dto: UpdateReviewDto }) =>
      updateReview(vars.reviewId, vars.dto),
    {
      onSuccess: async () => {
        await Promise.all([invalidateMine(), invalidatePublic()]);
      },
    },
  );

  const remove = useApiMutation(deleteReview, {
    onSuccess: async () => {
      await Promise.all([invalidateMine(), invalidatePublic()]);
    },
  });

  const markHelpful = useApiMutation(markReviewHelpful);
  const unmarkHelpful = useApiMutation(removeReviewHelpful);

  return { create, update, remove, markHelpful, unmarkHelpful };
}
