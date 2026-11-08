"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Live `window.matchMedia(query).matches`. `false` during SSR and hydration,
 * then the real value; updates when the media query changes. Subscribes to the
 * browser instead of copying the value into React state from an effect.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
