"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { getAccessToken, getRefreshToken } from "@/lib/auth/token";
import { refreshAccessToken } from "@/lib/api/apiClient";
import { fetchCustomerMe } from "@/features/auth/api/auth.service";
import { applyCustomerProfile } from "@/features/auth/lib/applyAuthSession";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * App-wide session bootstrap (Phase 1 Flow C).
 * Runs once on mount: refresh if needed → GET /storefront/customer/me.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const started = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function bootstrap() {
      // Login may already have hydrated while this mounts
      if (useAuthStore.getState().bootstrapped && useAuthStore.getState().user) {
        return;
      }

      const access = getAccessToken();
      const refresh = getRefreshToken();

      if (!access && !refresh) {
        if (!cancelled) {
          setUser(null);
          setBootstrapped(true);
        }
        return;
      }

      try {
        if (!getAccessToken() && getRefreshToken()) {
          const ok = await refreshAccessToken();
          if (!ok) {
            if (!cancelled) {
              setUser(null);
              setBootstrapped(true);
            }
            return;
          }
        }

        const me = await fetchCustomerMe();
        if (!cancelled) applyCustomerProfile(me);
      } catch {
        const ok = await refreshAccessToken();
        if (ok) {
          try {
            const me = await fetchCustomerMe();
            if (!cancelled) applyCustomerProfile(me);
          } catch {
            if (!cancelled && !useAuthStore.getState().user) setUser(null);
          }
        } else if (!cancelled && !useAuthStore.getState().user) {
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setBootstrapped, setUser]);

  return children;
}
