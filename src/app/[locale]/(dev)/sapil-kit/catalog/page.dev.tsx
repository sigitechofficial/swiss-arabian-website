import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/brands/sapil/theme.css";
import { SapilRoot } from "@/brands/sapil/ui/SapilRoot";
import { CatalogKit } from "@/brands/sapil/kit/CatalogKit";

/**
 * Dev-only fixture page for the Sapil catalog components (listing toolbar, card
 * grid, hero, product page) filled with the v9 mock products.
 * 404s in production unless SAPIL_KIT=1 (visual diff against `next start`).
 * ?only=<spec> renders one part (scripts/sapil-visual-diff.mjs).
 */
export const metadata: Metadata = {
  title: "Sapil catalog kit",
  robots: { index: false, follow: false },
};

export default async function SapilCatalogKitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SAPIL_KIT !== "1") notFound();
  const { only } = await searchParams;
  return (
    <SapilRoot className="flex-1">
      <CatalogKit only={typeof only === "string" ? only : undefined} />
    </SapilRoot>
  );
}
