import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Translator } from "@/lib/i18n/messages";
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

/** Shown while the page loads, in the page's language (from `?lang=`). */
function TabbyReturnFallback({ t }: { t: Translator }) {
  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
      <CheckoutSpinnerState
        eyebrow={t("checkout.state.verificationPending")}
        title={t("checkout.tabby.confirming")}
        body={t("checkout.state.dontClose")}
      />
    </CheckoutStateShell>
  );
}

/** Tabby hosted-page browser return — path locked with BE: `/payments/tabby/return`. */
export default async function TabbyReturnPage() {
  const { t } = await routeTranslator();
  return (
    <Suspense fallback={<TabbyReturnFallback t={t} />}>
      <TabbyReturnView />
    </Suspense>
  );
}
