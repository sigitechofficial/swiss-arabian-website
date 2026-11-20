import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSpinnerState, CheckoutStateShell, TamaraReturnView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.tamaraConfirming"),
    robots: { index: false, follow: false },
  };
}

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
