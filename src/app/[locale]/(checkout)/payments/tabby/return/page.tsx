import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSpinnerState, CheckoutStateShell, TabbyReturnView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.tabbyConfirming"),
    robots: { index: false, follow: false },
  };
}

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
