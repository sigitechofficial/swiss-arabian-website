import type { Metadata } from "next";
import { Suspense } from "react";
import { TabbyReturnView } from "@/features/checkout";
import { CheckoutSpinnerState, CheckoutStateShell } from "@/features/checkout/components/CheckoutStateShell";

export const metadata: Metadata = {
  title: "Confirming Tabby payment",
  robots: { index: false, follow: false },
};

function TabbyReturnFallback() {
  return (
    <CheckoutStateShell current="Payment">
      <CheckoutSpinnerState
        eyebrow="Verification pending"
        title="We’re confirming your payment with Tabby."
        body="Don’t close this page."
      />
    </CheckoutStateShell>
  );
}

/** Tabby hosted-page browser return — path locked with BE: `/payments/tabby/return`. */
export default function TabbyReturnPage() {
  return (
    <Suspense fallback={<TabbyReturnFallback />}>
      <TabbyReturnView />
    </Suspense>
  );
}
