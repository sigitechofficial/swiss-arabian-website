"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { getAccessToken, getRefreshToken, clearTokens } from "@/lib/auth/token";
import { refreshAccessToken } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";
import { fetchCustomerMe } from "@/features/auth/api/auth.service";
import { applyCustomerProfile } from "@/features/auth/lib/applyAuthSession";
import { useAuthStore } from "@/stores/useAuthStore";

/** Pauses between tries when the server can't be reached (a restart, a dropped connection). */
const RETRY_DELAYS_MS = [600, 1800];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The server refused this session (signed out, expired, revoked). */
function sessionRefused(error: unknown): boolean {
  return error instanceof ApiClientError && (error.status === 401 || error.status === 403);
}

/**
 * Session bootstrap on app mount:
 *   1. no access + no refresh → guest
 *   2. refresh only          → refresh, then `me`
 *   3. access present        → `me`
 *   4. the server refuses the session → drop it (guest)
 *   5. the server can't be reached    → try again a few times; if it still
 *      can't, keep the session for the next page and show the page as a guest
 *      for now. A server blip must never sign a shopper out.
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

    function dropSession() {
      clearTokens();
      useAuthStore.getState().reset();
    }

    /** True once signed in; false when the session was refused or the server stayed unreachable. */
    async function confirmSession(): Promise<boolean> {
      for (let attempt = 0; ; attempt += 1) {
        try {
          if (!getAccessToken() && getRefreshToken()) {
            const outcome = await refreshAccessToken();
            if (outcome === "rejected") {
              dropSession();
              return false;
            }
            if (outcome === "unreachable") throw new Error("unreachable");
          }
          applyCustomerProfile(await fetchCustomerMe());
          return true;
        } catch (error) {
          if (sessionRefused(error) || (!getAccessToken() && !getRefreshToken())) {
            dropSession();
            return false;
          }
          const delay = RETRY_DELAYS_MS[attempt];
          if (delay == null) {
            // Keep the tokens: the next page load tries again.
            useAuthStore.getState().setUser(null);
            return false;
          }
          await wait(delay);
        }
      }
    }

    async function bootstrap() {
      const { setUser, setBootstrapped } = useAuthStore.getState();

      if (!getAccessToken() && !getRefreshToken()) {
        setUser(null);
        setBootstrapped(true);
        return;
      }

      try {
        await confirmSession();
      } finally {
        setBootstrapped(true);
      }
    }

    void bootstrap();
  }, []);

  return children;
}
