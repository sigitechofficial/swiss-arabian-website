"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { getAccessToken, getRefreshToken, clearTokens } from "@/lib/auth/token";
import { refreshAccessToken } from "@/lib/api/apiClient";
import { fetchCustomerMe } from "@/features/auth/api/auth.service";
import { applyCustomerProfile } from "@/features/auth/lib/applyAuthSession";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Session bootstrap on app mount:
 *   1. no access + no refresh → guest
 *   2. refresh only          → refresh, then `me`
 *   3. access present        → `me`
 *   4. anything fails        → drop the session
 * `bootstrapped` is always set, so the UI can never hang on "Checking session…".
 *
 * The `started` ref makes this run exactly once, including across React
 * StrictMode's dev double-mount. Deliberately no `cancelled` flag: the store is
 * global (zustand), so writing to it after an unmount is safe — and gating the
 * terminal `setBootstrapped(true)` on a cancel flag is what would strand the
 * guard at "Checking session…" when StrictMode unmounts the first pass.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function bootstrap() {
      const { setUser, setBootstrapped } = useAuthStore.getState();

      const access = getAccessToken();
      const refresh = getRefreshToken();

      if (!access && !refresh) {
        setUser(null);
        setBootstrapped(true);
        return;
      }

      try {
        if (!access && refresh) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            clearTokens();
            useAuthStore.getState().reset();
            return;
          }
        }

        applyCustomerProfile(await fetchCustomerMe());
      } catch {
        // Expired or revoked — fall back to guest rather than blocking render.
        clearTokens();
        useAuthStore.getState().reset();
      } finally {
        setBootstrapped(true);
      }
    }

    void bootstrap();
  }, []);

  return children;
}
