"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";
import type { StoreMapProps } from "./storeMapTypes";

const GoogleStoreMap = dynamic(() => import("./GoogleStoreMap"), { ssr: false });
const LeafletStoreMap = dynamic(() => import("./LeafletStoreMap"), { ssr: false });

/**
 * The store map, brand-neutral: Google Maps when Google Maps is on for this
 * address's market (switchboard, ADR-005 phase E), otherwise a free street map. Loaded only when it scrolls into view, so the
 * store list (server-rendered) never waits for it.
 */
export function StoreMap(props: StoreMapProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const maps = useSiteIntegrations().googleMaps;
  const apiKey = maps?.browserKey ?? "";
  const mapId = maps?.mapId ?? undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const { className, ...mapProps } = props;
  return (
    <div ref={ref} role="region" aria-label={props.label} className={className}>
      {visible ? (
        apiKey ? (
          <GoogleStoreMap {...mapProps} apiKey={apiKey} mapId={mapId} />
        ) : (
          <LeafletStoreMap {...mapProps} />
        )
      ) : null}
    </div>
  );
}
