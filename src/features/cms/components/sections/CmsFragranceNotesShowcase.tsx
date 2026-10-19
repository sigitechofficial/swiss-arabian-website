"use client";

import { LandingNotes } from "@/features/home/components/landing/LandingNotes";

export type CmsFragranceNotesShowcaseData = {
  heading?: string | null;
};

export function CmsFragranceNotesShowcase({
  data,
}: {
  data: CmsFragranceNotesShowcaseData;
}) {
  return <LandingNotes heading={data.heading} />;
}
