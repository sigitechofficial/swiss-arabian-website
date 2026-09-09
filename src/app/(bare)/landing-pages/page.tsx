import type { Metadata } from "next";
import { LandingPagesIndexView } from "@/features/landing-pages";

export const metadata: Metadata = {
  title: "Landing pages",
};

export default function LandingPagesPage() {
  return <LandingPagesIndexView />;
}
