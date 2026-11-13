import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSpinnerState, CheckoutStateShell, TelrReturnView } from "@brand-ui";

export const metadata: Metadata = {
  title: "Confirming Telr payment",
  robots: { index: false, follow: false },
};

function TelrReturnFallback() {
  return (
    <CheckoutStateShell current="Payment">
      <CheckoutSpinnerState
        eyebrow="Verification pending"
        title="Payment submitted — we’re confirming with the bank."
        body="Don’t close this page."
      />
    </CheckoutStateShell>
  );
}

/** Telr HPP browser return — path locked with BE: `/payments/telr/return`. */
export default function TelrReturnPage() {
  return (
    <Suspense fallback={<TelrReturnFallback />}>
      <TelrReturnView />
    </Suspense>
  );
}
