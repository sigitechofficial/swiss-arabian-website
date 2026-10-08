"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { StoreLocation } from "../data/storesContent";

type StoreLeafletMapProps = {
  stores: StoreLocation[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

function pinHtml(label: string, active: boolean): string {
  const bg = active ? "#a25e48" : "#b46e57";
  const size = active ? 28 : 24;
  return `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};color:#fff;font:700 11px/${size}px Nunito,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(44,36,29,.35);border:2px solid #fff">${label}</div>`;
}

/**
 * English street map with every store pin visible on load.
 */
export function StoreLeafletMap({
  stores,
  activeId,
  onSelect,
}: StoreLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(0);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = leaflet.default;
      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
        attributionControl: true,
      });
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          maxZoom: 19,
        },
      ).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      requestAnimationFrame(() => {
        map.invalidateSize();
        setMapReady((n) => n + 1);
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    let cancelled = false;
    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || mapRef.current !== map) return;
      const L = leaflet.default;
      layer.clearLayers();

      const bounds = L.latLngBounds([]);
      stores.forEach((store, index) => {
        const active = store.id === activeId;
        const marker = L.marker([store.lat, store.lng], {
          title: store.name,
          zIndexOffset: active ? 1000 : 0,
          icon: L.divIcon({
            className: "store-map-pin",
            iconSize: active ? [28, 28] : [24, 24],
            iconAnchor: active ? [14, 28] : [12, 24],
            html: pinHtml(String(index + 1), active),
          }),
        });
        marker.on("click", () => onSelectRef.current(store.id));
        marker.addTo(layer);
        bounds.extend([store.lat, store.lng]);
      });

      if (stores.length === 0) {
        map.setView([24.9, 55.4], 7);
        return;
      }

      if (activeId) {
        const selected = stores.find((store) => store.id === activeId);
        if (selected) {
          map.flyTo([selected.lat, selected.lng], 13, { duration: 0.45 });
          return;
        }
      }

      if (stores.length === 1) {
        map.setView([stores[0].lat, stores[0].lng], 13);
        return;
      }

      map.fitBounds(bounds.pad(0.1), {
        animate: false,
        maxZoom: stores.length > 8 ? 9 : 13,
      });
      map.invalidateSize();
    })();

    return () => {
      cancelled = true;
    };
  }, [stores, activeId, mapReady]);

  return (
    <div
      ref={containerRef}
      className="size-full [&_.store-map-pin]:border-0 [&_.store-map-pin]:bg-transparent"
    />
  );
}
