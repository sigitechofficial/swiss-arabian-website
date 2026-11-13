import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/brands/sapil/theme.css";
import { SapilRoot } from "@/brands/sapil/ui/SapilRoot";
import { CommerceKit } from "@/brands/sapil/kit/CommerceKit";

/**
 * Dev-only fixtures for the Sapil bag drawer and checkout (v9 mock values), measured by
 * scripts/sapil-visual-diff.mjs. 404s in production unless SAPIL_KIT=1, like /sapil-kit.
 */
export const metadata: Metadata = {
  title: "Sapil commerce kit",
  robots: { index: false, follow: false },
};

export default async function SapilCommerceKitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SAPIL_KIT !== "1") notFound();
  const { only } = await searchParams;
  return (
    <SapilRoot className="flex-1">
      <CommerceKit only={typeof only === "string" ? only : undefined} />
    </SapilRoot>
  );
}
