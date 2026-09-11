import type { ReactNode } from "react";

import { Reveal } from "@/components/motion";

import { AccountTabNav } from "./AccountTabNav";

type AccountPageShellProps = {
  children: ReactNode;
};

/**
 * Signed-in chrome shared by every account frame: tab nav → content.
 * Auth gating lives in `src/app/(account)/layout.tsx`; the newsletter
 * placement is handled by the site footer.
 */
export function AccountPageShell({ children }: AccountPageShellProps) {
  return (
    <div className="bg-page">
      <AccountTabNav />
      <Reveal fade>{children}</Reveal>
    </div>
  );
}
