import type { Metadata } from "next";
import { Suspense } from "react";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { EmailLinkRedirect } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return { title: t("emailLinkOpening"), robots: { index: false, follow: false } };
}

/** A journey email's button (each brand draws its own "taking you there" page). */
export default function EmailLinkPage() {
  return (
    <Suspense fallback={null}>
      <EmailLinkRedirect />
    </Suspense>
  );
}
