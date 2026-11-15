"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { StoreCard, StoreType } from "../types";
import { openStatus } from "../utils/openingHours";
import { distanceKm } from "../utils/storeLinks";

/**
 * The current time, set only in the browser (after hydration) and refreshed
 * every minute. Server HTML never contains "open now", so cached pages can't
 * show a stale state and hydration never mismatches.
 */
const MINUTE = 60_000;
const subscribeMinute = (onChange: () => void) => {
  const id = window.setInterval(onChange, MINUTE / 4);
  return () => window.clearInterval(id);
};
const currentMinute = () => Math.floor(Date.now() / MINUTE);
const noMinute = () => null;

export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, noMinute);
  return useMemo(() => (minute == null ? null : new Date(minute * MINUTE)), [minute]);
}

export type LocatorStore = StoreCard & { distanceKm: number | null };
export type GeoState = "idle" | "locating" | "located" | "denied" | "unavailable";

const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٟ]/g, "")
    .toLowerCase();

/**
 * Store locator state shared by every brand's view: search (name, address,
 * area, city), area / type / "open now" filters, "near me" (the position stays
 * in the browser), and the selected store.
 */
export function useStoreLocator(stores: StoreCard[], options: { initialArea?: string } = {}) {
  const now = useNow();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(options.initialArea ?? "");
  const [type, setType] = useState<StoreType | "">("");
  const [openNow, setOpenNow] = useState(false);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [selected, setSelected] = useState<string | null>(null);

  const types = useMemo(() => [...new Set(stores.map((s) => s.storeType))], [stores]);

  const results: LocatorStore[] = useMemo(() => {
    const q = normalize(query.trim());
    const list = stores
      .filter((s) => !area || s.areaSlug === area)
      .filter((s) => !type || s.storeType === type)
      .filter((s) => !q || normalize(`${s.name} ${s.address} ${s.city} ${s.areaName}`).includes(q))
      .filter((s) => !openNow || (now ? openStatus(s, now).kind === "open" : true))
      .map((s) => ({ ...s, distanceKm: position ? distanceKm(position, s) : null }));
    return position ? list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)) : list;
  }, [stores, area, type, query, openNow, now, position]);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("unavailable");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setPosition(here);
        setGeo("located");
        setArea("");
        // Point the list and map at the nearest shop.
        const nearest = stores.reduce<StoreCard | null>(
          (best, s) => (!best || distanceKm(here, s) < distanceKm(here, best) ? s : best),
          null,
        );
        if (nearest) setSelected(nearest.slug);
      },
      () => setGeo("denied"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }, [stores]);

  const filtered = Boolean(query || area || type || openNow);
  const clear = useCallback(() => {
    setQuery("");
    setArea(options.initialArea ?? "");
    setType("");
    setOpenNow(false);
  }, [options.initialArea]);

  return {
    now,
    query,
    setQuery,
    area,
    setArea,
    type,
    setType,
    types,
    openNow,
    setOpenNow,
    geo,
    locate,
    sortedByDistance: Boolean(position),
    selected,
    setSelected,
    results,
    filtered,
    clear,
  };
}
