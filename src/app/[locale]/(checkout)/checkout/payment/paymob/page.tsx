import type { Metadata } from "next";
import { PaymobPaymentFormView } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Card payment",
  robots: { index: false, follow: false },
};

export default function PaymobPaymentPage() {
  return <PaymobPaymentFormView />;
}
