import type { Metadata } from "next";

import { FaqPageView } from "@/features/faq";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers on orders, delivery, scents, samples and more — from the house of Swiss Arabian.",
};

export default function FaqPage() {
  return <FaqPageView />;
}
