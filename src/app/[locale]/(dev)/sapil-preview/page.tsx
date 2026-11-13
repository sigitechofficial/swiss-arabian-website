import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/brands/sapil/theme.css";
import { SapilRoot } from "@/brands/sapil/ui/SapilRoot";
import { SapilServerCopy } from "@/brands/sapil/components/shell/SapilStorefrontShell";
import { SapilShellPreview } from "@/brands/sapil/kit/SapilShellPreview";

/**
 * Dev-only: Sapil's chrome and static home parts with v9's mock values, for
 * scripts/sapil-visual-diff.mjs (?only=<piece>). 404s in production unless SAPIL_KIT=1.
 */
export const metadata: Metadata = {
  title: "Sapil preview",
  robots: { index: false, follow: false },
};

export default async function SapilPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SAPIL_KIT !== "1") notFound();
  const { only, lead } = await searchParams;
  return (
    <SapilRoot className="flex-1">
      <SapilServerCopy>
        <SapilShellPreview only={typeof only === "string" ? only : undefined} lead={typeof lead === "string" ? lead : undefined} />
      </SapilServerCopy>
    </SapilRoot>
  );
}
