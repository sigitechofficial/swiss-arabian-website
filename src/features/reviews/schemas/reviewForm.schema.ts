import { z } from "zod";
import type { CreateReviewDto, UpdateReviewDto } from "../types/reviews";

export const reviewFormSchema = z.object({
  rating: z
    .number({ error: "Choose a rating" })
    .int()
    .min(1, "Choose a rating")
    .max(5),
  title: z.string().max(120, "Title is too long"),
  body: z.string().max(4000, "Review is too long"),
  displayName: z.string().max(80, "Name is too long"),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const emptyReviewFormValues: ReviewFormValues = {
  rating: 0,
  title: "",
  body: "",
  displayName: "",
};

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toCreateReviewDto(
  values: ReviewFormValues,
  ids: { productId: string; variantId?: string },
): CreateReviewDto {
  const dto: CreateReviewDto = {
    productId: ids.productId,
    rating: values.rating,
  };
  const title = optionalText(values.title);
  const body = optionalText(values.body);
  const displayName = optionalText(values.displayName);
  if (title) dto.title = title;
  if (body) dto.body = body;
  if (displayName) dto.displayName = displayName;
  if (ids.variantId) dto.variantId = ids.variantId;
  return dto;
}

export function toUpdateReviewDto(values: ReviewFormValues): UpdateReviewDto {
  return {
    rating: values.rating,
    title: optionalText(values.title) ?? "",
    body: optionalText(values.body) ?? "",
    displayName: optionalText(values.displayName) ?? "",
  };
}
