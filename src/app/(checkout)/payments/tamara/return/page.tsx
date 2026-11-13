import type { Metadata } from "next";
import { Suspense } from "react";
import { TamaraReturnView } from "@/features/checkout";
import { CheckoutSpinnerState, CheckoutStateShell } from "@/features/checkout/components/CheckoutStateShell";

export const metadata: Metadata = {
  title: "Confirming Tamara payment",
  robots: { index: false, follow: false },
};

function TamaraReturnFallback() {
  return (
    <CheckoutStateShell current="Payment">
      <CheckoutSpinnerState
        eyebrow="Verification pending"
        title="We’re confirming your payment with Tamara."
        body="Don’t close this page."
      />
    </CheckoutStateShell>
  );
}

/** Tamara hosted-page browser return — path locked with BE: `/payments/tamara/return`. */
export default function TamaraReturnPage() {
  return (
    <Suspense fallback={<TamaraReturnFallback />}>
      <TamaraReturnView />
    </Suspense>
  );
}
