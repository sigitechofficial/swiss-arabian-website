import { Suspense } from "react";
import { PaymentSuccessView } from "@/features/checkout/components/PaymentSuccessView";

export const metadata = { title: "Verifying Payment" };

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      }
    >
      <PaymentSuccessView />
    </Suspense>
  );
}
