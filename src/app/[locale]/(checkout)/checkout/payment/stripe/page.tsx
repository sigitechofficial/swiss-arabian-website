import type { Metadata } from "next";
import { StripePaymentFormView } from "@brand-ui";

export const metadata: Metadata = {
  title: "Card payment",
  robots: { index: false, follow: false },
};

export default function StripePaymentPage() {
  return <StripePaymentFormView />;
}
