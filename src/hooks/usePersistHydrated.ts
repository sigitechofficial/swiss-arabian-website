"use client";

import { useSyncExternalStore } from "react";

/** The part of zustand's `persist` API this hook needs. */
type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (listener: () => void) => () => void;
};

type PersistedStore = { persist?: PersistApi };

const noopSubscribe = () => () => {};

/**
 * `true` once a zustand `persist` store has loaded its browser state; `false`
 * during SSR and until rehydration finishes. Subscribes to the store instead
 * of mirroring its status into React state from an effect.
 */
export function usePersistHydrated(store: PersistedStore): boolean {
  const persist = store.persist;
  return useSyncExternalStore(
    persist ? persist.onFinishHydration : noopSubscribe,
    () => (persist ? persist.hasHydrated() : true),
    () => false,
  );
}
