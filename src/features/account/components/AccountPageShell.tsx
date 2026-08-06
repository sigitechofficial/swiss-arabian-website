import type { ReactNode } from "react";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { Reveal } from "@/components/motion";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";

import { AccountTabNav } from "./AccountTabNav";

type AccountPageShellProps = {
  children: ReactNode;
  /** Set false on pages that render their own newsletter placement. */
  newsletter?: boolean;
};

/** Signed-in chrome shared by every account frame: tab nav → content → newsletter. */
export function AccountPageShell({
  children,
  newsletter = true,
}: AccountPageShellProps) {
  return (
    <AuthGuard requireAuth>
      <div className="bg-page">
        <AccountTabNav />
        <Reveal fade>{children}</Reveal>
        {newsletter ? (
          <Reveal>
            <NewsletterSection />
          </Reveal>
        ) : null}
      </div>
    </AuthGuard>
  );
}
