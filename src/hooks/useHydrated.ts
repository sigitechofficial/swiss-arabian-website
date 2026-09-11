"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` during SSR and the hydration pass, `true` afterwards. For reading
 * browser-only state (localStorage / sessionStorage / persisted stores) without
 * a hydration mismatch — and without the setState-in-effect "mounted" pattern.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
