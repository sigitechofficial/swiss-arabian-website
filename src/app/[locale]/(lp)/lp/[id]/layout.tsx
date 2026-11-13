import { notFound } from "next/navigation";
import { landingPageById } from "@/features/landing-pages";
import { StorefrontShell } from "@brand-ui";

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
