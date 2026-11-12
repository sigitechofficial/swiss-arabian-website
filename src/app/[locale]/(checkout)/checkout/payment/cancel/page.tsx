import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/ui";
import { PaymentCancelView } from "@/features/checkout";

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
