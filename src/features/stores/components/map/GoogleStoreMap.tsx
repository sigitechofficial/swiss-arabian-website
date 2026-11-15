"use client";

import { useEffect, useMemo } from "react";
import { APIProvider, AdvancedMarker, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { pinBounds, spreadOverlapping, type StoreMapPin, type StoreMapProps } from "./storeMapTypes";

function FollowSelection({ pins, activeId }: { pins: StoreMapPin[]; activeId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !activeId) return;
    const pin = pins.find((p) => p.id === activeId);
    if (!pin) return;
    map.panTo({ lat: pin.latitude, lng: pin.longitude });
    if ((map.getZoom() ?? 0) < 13) map.setZoom(13);
  }, [map, pins, activeId]);
  return null;
}

/**
 * Google Maps with the brand's Maps key and map id (labels in the page's
 * language). Advanced markers in the brand colours when a map id is set,
 * classic labelled markers otherwise.
 */
export default function GoogleStoreMap({
  apiKey,
  mapId,
  pins,
  activeId,
  onSelect,
  pinColor,
  activePinColor,
  language,
  singleZoom = 15,
}: StoreMapProps & { apiKey: string; mapId?: string }) {
  const spread = useMemo(() => spreadOverlapping(pins), [pins]);
  const view = useMemo(() => {
    if (spread.length === 1) {
      return { defaultCenter: { lat: spread[0]!.latitude, lng: spread[0]!.longitude }, defaultZoom: singleZoom };
    }
    const b = pinBounds(spread);
    return spread.length ? { defaultBounds: { ...b, padding: 32 } } : { defaultCenter: { lat: 24.9, lng: 55.4 }, defaultZoom: 7 };
  }, [spread, singleZoom]);

  return (
    <APIProvider apiKey={apiKey} language={language}>
      <Map
        {...view}
        mapId={mapId || undefined}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        streetViewControl={false}
        mapTypeControl={false}
        clickableIcons={false}
        className="size-full"
      >
        {spread.map((pin) => {
          const active = pin.id === activeId;
          const color = active ? activePinColor : pinColor;
          return mapId ? (
            <AdvancedMarker
              key={pin.id}
              position={{ lat: pin.latitude, lng: pin.longitude }}
              title={pin.title}
              zIndex={active ? 1000 : undefined}
              onClick={() => onSelect?.(pin.id)}
            >
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: active ? 30 : 24,
                  height: active ? 30 : 24,
                  lineHeight: `${active ? 30 : 24}px`,
                  borderRadius: 9999,
                  background: color,
                  color: "#fff",
                  font: "700 11px system-ui, sans-serif",
                  textAlign: "center",
                  border: "2px solid #fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.35)",
                }}
              >
                {pin.label}
              </span>
            </AdvancedMarker>
          ) : (
            <Marker
              key={pin.id}
              position={{ lat: pin.latitude, lng: pin.longitude }}
              title={pin.title}
              label={pin.label ? { text: pin.label, color: "#fff", fontSize: "11px", fontWeight: "700" } : undefined}
              zIndex={active ? 1000 : undefined}
              onClick={() => onSelect?.(pin.id)}
            />
          );
        })}
        <FollowSelection pins={spread} activeId={activeId} />
      </Map>
    </APIProvider>
  );
}
