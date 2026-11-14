"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { pinBounds, spreadOverlapping, type StoreMapProps } from "./storeMapTypes";

function pinHtml(label: string, color: string, active: boolean): string {
  const size = active ? 30 : 24;
  const safe = label.replace(/[^\w؀-ۿ -]/g, "");
  return `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#fff;font:700 11px/${size}px system-ui,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid #fff">${safe}</div>`;
}

/**
 * Street map without a Google Maps key (OpenStreetMap-style tiles from Esri).
 * Used when the brand has no Maps key configured.
 */
export default function LeafletStoreMap({ pins, activeId, onSelect, pinColor, activePinColor, singleZoom = 15 }: StoreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(0);
  const select = useEffectEvent((id: string) => onSelect?.(id));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      requestAnimationFrame(() => {
        map.invalidateSize();
        setReady((n) => n + 1);
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
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !map || !layer) return;
    let cancelled = false;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      layer.clearLayers();
      const spread = spreadOverlapping(pins);
      for (const pin of spread) {
        const active = pin.id === activeId;
        L.marker([pin.latitude, pin.longitude], {
          title: pin.title,
          alt: pin.title,
          keyboard: true,
          zIndexOffset: active ? 1000 : 0,
          icon: L.divIcon({
            className: "store-map-pin",
            iconSize: active ? [30, 30] : [24, 24],
            iconAnchor: active ? [15, 30] : [12, 24],
            html: pinHtml(pin.label ?? "", active ? activePinColor : pinColor, active),
          }),
        })
          .on("click", () => select(pin.id))
          .addTo(layer);
      }
      if (!spread.length) return;
      const selected = activeId ? spread.find((p) => p.id === activeId) : null;
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 13), { duration: 0.4 });
      } else if (spread.length === 1) {
        map.setView([spread[0]!.latitude, spread[0]!.longitude], singleZoom);
      } else {
        const b = pinBounds(spread);
        map.fitBounds(
          [
            [b.south, b.west],
            [b.north, b.east],
          ],
          { padding: [24, 24], maxZoom: 13, animate: false },
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pins, activeId, ready, pinColor, activePinColor, singleZoom]);

  return <div ref={containerRef} className="size-full [&_.store-map-pin]:border-0 [&_.store-map-pin]:bg-transparent" />;
}
