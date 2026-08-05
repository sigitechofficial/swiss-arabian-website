import type { ReactNode } from "react";

import { AuthGuard } from "@/components/guards/AuthGuard";
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
        {children}
        {newsletter ? <NewsletterSection /> : null}
      </div>
    </AuthGuard>
  );
}
