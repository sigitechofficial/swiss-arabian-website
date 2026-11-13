import { Suspense } from "react";
import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { ReviewRequestPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.review.title"),
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
