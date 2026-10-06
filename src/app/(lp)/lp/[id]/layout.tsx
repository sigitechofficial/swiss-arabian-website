import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { landingPageById } from "@/features/landing-pages";

export default async function LandingVariantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = landingPageById(id);
  if (!page) notFound();

  return <StorefrontShell navbarVariant={page.variant}>{children}</StorefrontShell>;
}
