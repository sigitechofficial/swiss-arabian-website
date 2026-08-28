import { Suspense } from "react";
import { StripePaymentFormView } from "@/features/checkout/components/StripePaymentFormView";

export const metadata = { title: "Secure Card Payment — Swiss Arabian" };

export default function StripePaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page">
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      }
    >
      <StripePaymentFormView />
    </Suspense>
  );
}
