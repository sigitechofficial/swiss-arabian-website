import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ReviewRequestPageView } from "@/features/reviews/components/ReviewRequestPageView";

export async function generateMetadata(): Promise<Metadata> {
  const ar = (await headers()).get("x-shop-locale") === "ar";
  return {
    title: ar ? "قيّم طلبك" : "Review your order",
    robots: { index: false, follow: false },
  };
}

/** Page linked from the review request email: rate each product of the order, no sign-in. */
export default async function ReviewRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={null}>
      <ReviewRequestPageView token={token} />
    </Suspense>
  );
}
