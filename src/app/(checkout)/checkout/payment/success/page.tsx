import type { Metadata } from "next";
import { PaymentSuccessView } from "@/features/checkout";

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return <PaymentSuccessView />;
}
