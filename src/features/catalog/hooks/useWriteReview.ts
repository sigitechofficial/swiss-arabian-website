"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { ApiClientError } from "@/lib/api/apiError";
import { toastApiError } from "@/lib/api/toastApiError";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useAuthStore } from "@/stores/useAuthStore";
import { createCustomerReview } from "../api/reviews.service";
import { useReviewsCopy } from "../i18n/reviewsCopy";
import { writeReviewSchema, type WriteReviewValues } from "../schemas/review.schema";

/** Where the page's reviews section is, so sign-in brings the shopper back to it. */
export type WriteReviewAnchor = "pdp-reviews" | "reviews";

/**
 * Writing a review from the product page, every brand: the form (translated
 * checks), the shopper's name filled in, sign-in first for a guest, and what
 * the server says (published, waiting for approval, already reviewed, only
 * for buyers). Each brand draws its own panel from this.
 */
export function useWriteReview({
  open,
  onClose,
  productId,
  variantId,
  anchor,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  variantId?: string;
  anchor: WriteReviewAnchor;
}) {
  const router = useLocaleRouter();
  const pathname = usePathname();
  const zoneCode = useSelectedCatalogMarket()?.zoneCode ?? null;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const t = useReviewsCopy();
  const [submitting, setSubmitting] = useState(false);
  const defaultName = useMemo(
    () => user?.fullName?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "",
    [user],
  );
  const schema = useMemo(() => writeReviewSchema(t.errors), [t.errors]);
  const form = useForm<WriteReviewValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 5, title: "", body: "", name: defaultName, honest: true },
  });
  const rating = useWatch({ control: form.control, name: "rating" });
  const body = useWatch({ control: form.control, name: "body" }) ?? "";

  // A guest signs in first and comes back to the reviews.
  useEffect(() => {
    if (open && !isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(`${pathname}#${anchor}`)}`);
      onClose();
    }
    if (open && defaultName && !form.getValues("name")) form.setValue("name", defaultName);
  }, [open, isAuthenticated, defaultName, form, onClose, pathname, router, anchor]);

  const submit = form.handleSubmit(async (values) => {
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
      toast(result.status === "APPROVED" ? t.live : t.pending, "success");
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
  });

  return {
    t,
    form,
    rating,
    bodyLength: body.length,
    setRating: (value: number) => form.setValue("rating", value, { shouldValidate: true }),
    submit,
    submitting,
    /** The panel shows only for a signed-in shopper (a guest is sent to sign in). */
    canWrite: open && isAuthenticated,
  };
}
