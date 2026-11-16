import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailLinkRedirect } from "@/features/journeys/components/EmailLinkRedirect";

export const metadata: Metadata = {
  title: "Opening…",
  robots: { index: false, follow: false },
};

export default function EmailLinkPage() {
  return (
    <Suspense fallback={null}>
      <EmailLinkRedirect />
    </Suspense>
  );
}
