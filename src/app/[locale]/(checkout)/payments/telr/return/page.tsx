import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSpinnerState, CheckoutStateShell, TelrReturnView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.telrConfirming"),
    robots: { index: false, follow: false },
  };
}

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
