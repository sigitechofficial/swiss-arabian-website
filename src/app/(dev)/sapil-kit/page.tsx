import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/brands/sapil/theme.css";
import { SapilRoot } from "@/brands/sapil/ui/SapilRoot";
import { SapilKit } from "@/brands/sapil/kit/SapilKit";

/**
 * Dev-only visual reference for the Sapil design system (v9).
 * 404s in production unless SAPIL_KIT=1 (used to run the visual diff against `next start`).
 * ?only=<id> renders one component alone (scripts/sapil-visual-diff.mjs).
 */
export const metadata: Metadata = {
  title: "Sapil kit",
  robots: { index: false, follow: false },
};

export default async function SapilKitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SAPIL_KIT !== "1") notFound();
  const { only } = await searchParams;
  return (
    <SapilRoot className="flex-1">
      <SapilKit only={typeof only === "string" ? only : undefined} />
    </SapilRoot>
  );
}
