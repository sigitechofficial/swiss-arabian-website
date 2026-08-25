"use client";

import Link from "next/link";
import { AppButton, AppCard } from "@/components/ui";
import { accountTabNav } from "@/lib/navigation/storeNavigation";
import { endSession } from "@/lib/auth/endSession";
import { logoutCustomer } from "@/features/auth/api/auth.service";
import { toastApiError } from "@/lib/api/toastApiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export function AccountPageView() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutCustomer();
    } catch (error) {
      toastApiError(error);
    } finally {
      endSession();
      router.push("/");
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl text-sa-primary">Account</h1>
      <p className="mt-2 text-sa-muted">
        {user?.fullName || user?.email || "Signed in"}
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {accountTabNav.map((item) => (
          <Link key={item.href} href={item.href}>
            <AppCard title={item.label}>
              <p className="text-sm text-sa-muted">Open {item.label.toLowerCase()}</p>
            </AppCard>
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <AppButton dsVariant="secondary" onClick={() => void handleLogout()}>
          Sign out
        </AppButton>
      </div>
    </section>
  );
}
