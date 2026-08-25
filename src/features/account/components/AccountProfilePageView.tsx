"use client";

import { AppCard } from "@/components/ui";
import { useAuthStore } from "@/stores/useAuthStore";

export function AccountProfilePageView() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <AppCard title="Profile" subtitle="Display only — edit is waiting on PATCH /me">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-sa-muted">Name</dt>
            <dd className="text-sa-primary">{user?.fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-sa-muted">Email</dt>
            <dd className="text-sa-primary">{user?.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-sa-muted">Phone</dt>
            <dd className="text-sa-primary">{user?.phoneE164 || "—"}</dd>
          </div>
        </dl>
      </AppCard>
    </section>
  );
}
