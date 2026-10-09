"use client";

import { NewsletterSection } from "@/features/home/components/NewsletterSection";

export type CmsNewsletterSignupData = {
  eyebrow?: string | null;
  heading?: string;
  description?: string | null;
  placeholder?: string | null;
  buttonLabel?: string | null;
  successMessage?: string | null;
};

export function CmsNewsletterSignup({ data }: { data: CmsNewsletterSignupData }) {
  const heading = data.heading?.trim();
  if (!heading) return null;

  return (
    <NewsletterSection
      eyebrow={data.eyebrow}
      heading={heading}
      description={data.description}
      placeholder={data.placeholder}
      buttonLabel={data.buttonLabel}
      successMessage={data.successMessage}
    />
  );
}
