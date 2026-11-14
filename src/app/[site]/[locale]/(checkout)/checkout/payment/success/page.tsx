import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { PaymentSuccessView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.paymentConfirming"),
    robots: { index: false, follow: false },
  };
}

export default function PaymentSuccessPage() {
  return <PaymentSuccessView />;
}
