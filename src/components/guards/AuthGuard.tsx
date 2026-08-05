"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PageLoading } from "@/components/ui";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthGuard({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    if (!bootstrapped || !requireAuth) return;
    if (!isAuthenticated) {
      const returnTo = pathname ? `?returnTo=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${returnTo}`);
    }
  }, [bootstrapped, isAuthenticated, requireAuth, router, pathname]);

  if (!bootstrapped) {
    return <PageLoading label="Checking session…" fill />;
  }

  if (requireAuth && !isAuthenticated) {
    return <PageLoading label="Redirecting…" fill />;
  }

  return children;
}
