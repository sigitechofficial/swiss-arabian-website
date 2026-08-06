"use client";

import { useCallback, useEffect, useMemo } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";

import { env } from "@/lib/config/env";
import {
  UAE_MAP_CENTER,
  UAE_MAP_ZOOM,
  type StoreLocation,
} from "../data/storesContent";

type StoreMapPanelProps = {
  stores: StoreLocation[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

/** Google Map with dummy store markers (Figma 106:522 locator panel). */
export function StoreMapPanel({
  stores,
  activeId,
  onSelect,
}: StoreMapPanelProps) {
  const apiKey = env.googleMapsApiKey;

  if (!apiKey) {
    return (
      <GoogleMapsEmbedFallback
        stores={stores}
        activeId={activeId}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden border border-sa-border lg:h-[550px] lg:sticky lg:top-28">
      <p className="pointer-events-none absolute left-3 top-3 z-[2] border border-sa-border bg-page/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sa-muted backdrop-blur-sm dark:bg-surface/90">
        United Arab Emirates
      </p>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={UAE_MAP_CENTER}
          defaultZoom={UAE_MAP_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="size-full"
          style={{ width: "100%", height: "100%" }}
        >
          <MapCameraController stores={stores} activeId={activeId} />
          {stores.map((store, index) => {
            const isActive = store.id === activeId;
            return (
              <Marker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                title={store.name}
                onClick={() => onSelect(store.id)}
                zIndex={isActive ? 20 : 10}
                label={{
                  text: String(index + 1),
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              />
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}

function MapCameraController({
  stores,
  activeId,
}: {
  stores: StoreLocation[];
  activeId: string | null;
}) {
  const map = useMap();

  const fitStores = useCallback(() => {
    if (!map || stores.length === 0) return;
    if (stores.length === 1) {
      map.panTo({ lat: stores[0].lat, lng: stores[0].lng });
      map.setZoom(13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const store of stores) {
      bounds.extend({ lat: store.lat, lng: store.lng });
    }
    map.fitBounds(bounds, 64);
  }, [map, stores]);

  useEffect(() => {
    fitStores();
  }, [fitStores]);

  useEffect(() => {
    if (!map || !activeId) return;
    const store = stores.find((item) => item.id === activeId);
    if (!store) return;
    map.panTo({ lat: store.lat, lng: store.lng });
    if ((map.getZoom() ?? 0) < 12) map.setZoom(13);
  }, [activeId, map, stores]);

  return null;
}

/**
 * Works without a Maps JS API key — classic Google Maps embed for the
 * selected (or first) dummy location. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * for the full multi-marker map.
 */
function GoogleMapsEmbedFallback({
  stores,
  activeId,
  onSelect,
}: StoreMapPanelProps) {
  const active = useMemo(() => {
    return stores.find((store) => store.id === activeId) ?? stores[0] ?? null;
  }, [activeId, stores]);

  const embedSrc = active
    ? `https://maps.google.com/maps?q=${active.lat},${active.lng}&z=14&hl=en&output=embed`
    : `https://maps.google.com/maps?q=United+Arab+Emirates&z=7&hl=en&output=embed`;

  return (
    <div className="relative h-[420px] w-full overflow-hidden border border-sa-border lg:h-[550px] lg:sticky lg:top-28">
      <p className="pointer-events-none absolute left-3 top-3 z-[2] border border-sa-border bg-page/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sa-muted backdrop-blur-sm dark:bg-surface/90">
        Google Maps · {active?.name ?? "UAE"}
      </p>

      <iframe
        key={active?.id ?? "uae"}
        title={
          active
            ? `Map of ${active.name}`
            : "Map of United Arab Emirates stores"
        }
        src={embedSrc}
        className="size-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {stores.length > 1 ? (
        <div className="absolute bottom-3 left-3 right-3 z-[2] flex gap-1.5 overflow-x-auto pb-0.5">
          {stores.map((store, index) => {
            const isActive = store.id === (active?.id ?? null);
            return (
              <button
                key={store.id}
                type="button"
                onClick={() => onSelect(store.id)}
                className={`shrink-0 border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "border-terra bg-terra text-white"
                    : "border-sa-border bg-page/95 text-sa-primary hover:border-terra dark:bg-surface/95"
                }`}
              >
                {index + 1}. {store.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
