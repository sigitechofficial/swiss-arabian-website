"use client";

import { useMemo } from "react";

import { StoreLeafletMap } from "./StoreLeafletMap";
import type { StoreLocation } from "../data/storesContent";

type StoreMapPanelProps = {
  stores: StoreLocation[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

/** Nudge stacked pins so kiosk + showroom in the same mall both show. */
function offsetOverlapping(stores: StoreLocation[]): StoreLocation[] {
  const seen = new Map<string, number>();
  return stores.map((store) => {
    const key = `${store.lat.toFixed(5)},${store.lng.toFixed(5)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n === 0) return store;
    return {
      ...store,
      lat: store.lat + n * 0.00035,
      lng: store.lng + n * 0.00035,
    };
  });
}

/** UAE map with every shop pin visible on first load. */
export function StoreMapPanel({
  stores,
  activeId,
  onSelect,
}: StoreMapPanelProps) {
  const pins = useMemo(() => offsetOverlapping(stores), [stores]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden border border-sa-border lg:sticky lg:top-28 lg:h-[550px]">
      <p className="pointer-events-none absolute left-3 top-3 z-2 border border-sa-border bg-page/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sa-muted backdrop-blur-sm dark:bg-surface/90">
        United Arab Emirates
      </p>
      <StoreLeafletMap stores={pins} activeId={activeId} onSelect={onSelect} />
    </div>
  );
}
