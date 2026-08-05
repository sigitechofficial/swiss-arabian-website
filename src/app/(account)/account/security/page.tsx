"use client";

import { AuthGuard } from "@/components/guards/AuthGuard";
import { AccountSecurityPageView } from "@/features/account/components/AccountSecurityPageView";

export default function AccountSecurityPage() {
  return (
    <AuthGuard requireAuth>
      <AccountSecurityPageView />
    </AuthGuard>
  );
}
