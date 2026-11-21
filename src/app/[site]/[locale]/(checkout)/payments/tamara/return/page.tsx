import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Translator } from "@/lib/i18n/messages";
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

/** Shown while the page loads, in the page's language (from `?lang=`). */
function TamaraReturnFallback({ t }: { t: Translator }) {
  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
      <CheckoutSpinnerState
        eyebrow={t("checkout.state.verificationPending")}
        title={t("checkout.tamara.confirming")}
        body={t("checkout.state.dontClose")}
      />
    </CheckoutStateShell>
  );
}

/** Tamara hosted-page browser return — path locked with BE: `/payments/tamara/return`. */
export default async function TamaraReturnPage() {
  const { t } = await routeTranslator();
  return (
    <Suspense fallback={<TamaraReturnFallback t={t} />}>
      <TamaraReturnView />
    </Suspense>
  );
}
