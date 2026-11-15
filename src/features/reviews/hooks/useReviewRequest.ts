"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import {
  fetchReviewRequest,
  submitReviewRequestReview,
  unsubscribeReviewEmails,
  type ReviewRequestProduct,
} from "../api/reviewRequests.service";

/**
 * The review request page (link from the email), for every brand's view:
 * the order's products (the one tapped in the email first, with its star
 * pre-selected: `?p=productId&r=5`) and `?unsubscribe=1` (stops the emails
 * once per page load). No sign-in: the link is the proof of purchase.
 */
export function useReviewRequest(
  token: string,
  options: { onUnsubscribeFailed?: () => void } = {},
) {
  const params = useSearchParams();
  const preProduct = params.get("p");
  const preRating = Number(params.get("r")) || 0;
  const wantsUnsubscribe = params.get("unsubscribe") === "1";
  const query = useQuery({
    queryKey: ["review-request", token],
    queryFn: () => fetchReviewRequest(token),
    retry: false,
  });
  const [unsubscribed, setUnsubscribed] = useState(false);
  const onFailedRef = useRef(options.onUnsubscribeFailed);
  useEffect(() => {
    onFailedRef.current = options.onUnsubscribeFailed;
  });

  // Once per page load — React dev mode runs effects twice.
  const unsubscribeSent = useRef(false);
  useEffect(() => {
    if (!wantsUnsubscribe || unsubscribeSent.current) return;
    unsubscribeSent.current = true;
    unsubscribeReviewEmails(token).then(
      () => setUnsubscribed(true),
      () => onFailedRef.current?.(),
    );
  }, [token, wantsUnsubscribe]);

  const data = query.data;
  const products = useMemo(() => {
    const list = data?.products ?? [];
    // The product tapped in the email first.
    return [...list].sort((a, b) => (a.productId === preProduct ? -1 : b.productId === preProduct ? 1 : 0));
  }, [data, preProduct]);

  const errorKind: "notFound" | "failed" | null = query.isError
    ? query.error instanceof ApiClientError && query.error.status === 404
      ? "notFound"
      : "failed"
    : null;

  return {
    data,
    products,
    isLoading: query.isLoading,
    errorKind,
    refetch: () => void query.refetch(),
    wantsUnsubscribe,
    unsubscribed,
    /** "Stop these emails" link on the page. */
    unsubscribe: () => unsubscribeReviewEmails(token).then(() => setUnsubscribed(true)),
    /** Star pre-selected for a product (the one tapped in the email). */
    initialRatingFor: (productId: string) => (productId === preProduct ? preRating : 0),
  };
}

export type ReviewSubmitOutcome = "needsRating" | "posted" | "already" | "failed";

/** One product's review form on the review request page. */
export function useReviewRequestCard({
  token,
  product,
  displayName,
  initialRating,
  onDone,
}: {
  token: string;
  product: ReviewRequestProduct;
  displayName: string;
  initialRating: number;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  /** Set once this page posted the review: live now, or waiting for moderation. */
  const [posted, setPosted] = useState<"live" | "pending" | null>(null);

  async function submit(): Promise<ReviewSubmitOutcome> {
    if (rating < 1) return "needsRating";
    setSaving(true);
    try {
      const res = await submitReviewRequestReview(token, {
        productId: product.productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        displayName: name.trim() || undefined,
      });
      setPosted(res.status === "APPROVED" ? "live" : "pending");
      onDone();
      return "posted";
    } catch (error) {
      return error instanceof ApiClientError && error.status === 409 ? "already" : "failed";
    } finally {
      setSaving(false);
    }
  }

  /** Reviewed before (from the API) or just now. */
  const done: "live" | "pending" | null =
    posted ?? (product.review ? (product.review.status === "APPROVED" ? "live" : "pending") : null);

  return {
    rating,
    setRating,
    title,
    setTitle,
    body,
    setBody,
    name,
    setName,
    saving,
    posted,
    done,
    submit,
  };
}
