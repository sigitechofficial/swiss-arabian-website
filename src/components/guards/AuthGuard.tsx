"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth/token";
import { apiGet } from "@/lib/api/apiClient";
import { PageLoading } from "@/components/ui";
import { useAuthStore, type StoreUser } from "@/stores/useAuthStore";

export function AuthGuard({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated, bootstrapped, setUser, setBootstrapped } =
    useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getAccessToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setBootstrapped(true);
        }
        return;
      }

      try {
        const me = await apiGet<StoreUser>("/store/auth/me");
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setBootstrapped, setUser]);

  useEffect(() => {
    if (!bootstrapped || !requireAuth) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [bootstrapped, isAuthenticated, requireAuth, router]);

  if (!bootstrapped) {
    return <PageLoading label="Checking session…" />;
  }

  if (requireAuth && !isAuthenticated) {
    return <PageLoading label="Redirecting…" />;
  }

  return children;
}
