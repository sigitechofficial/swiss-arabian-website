import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading, PaymentCancelView } from "@brand-ui";

export const metadata: Metadata = {
  title: "Complete your payment",
  robots: { index: false, follow: false },
};

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" fill />}>
      <PaymentCancelView />
    </Suspense>
  );
}
