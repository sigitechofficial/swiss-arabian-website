import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePageView } from "@/features/home";
import { landingPageById } from "@/features/landing-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = landingPageById(id);
  if (!page) return { title: "Landing page" };
  return { title: page.title };
}

export default async function LandingVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!landingPageById(id)) notFound();
  return <HomePageView />;
}
