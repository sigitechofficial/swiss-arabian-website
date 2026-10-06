import type { Metadata } from "next";
import { FaqPageView } from "@/features/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about orders, delivery, payments, samples and Swiss Arabian scents.",
};

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return <FaqPageView initialDrawer={topic} />;
}
