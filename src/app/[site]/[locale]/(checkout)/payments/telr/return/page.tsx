import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Translator } from "@/lib/i18n/messages";
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

/** Shown while the page loads, in the page's language (from `?lang=`). */
function TelrReturnFallback({ t }: { t: Translator }) {
  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
      <CheckoutSpinnerState
        eyebrow={t("checkout.state.verificationPending")}
        title={t("checkout.telr.submitted")}
        body={t("checkout.state.dontClose")}
      />
    </CheckoutStateShell>
  );
}

/** Telr HPP browser return — path locked with BE: `/payments/telr/return`. */
export default async function TelrReturnPage() {
  const { t } = await routeTranslator();
  return (
    <Suspense fallback={<TelrReturnFallback t={t} />}>
      <TelrReturnView />
    </Suspense>
  );
}
