export type StoreMapPin = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  /** Short text inside the pin (e.g. list number). */
  label?: string;
};

export type StoreMapProps = {
  pins: StoreMapPin[];
  activeId: string | null;
  onSelect?: (id: string) => void;
  /** Pin colours from the brand's design tokens (CSS colours). */
  pinColor: string;
  activePinColor: string;
  /** Map labels language, e.g. "ar". */
  language: string;
  /** Accessible name of the map region. */
  label: string;
  /** Zoom used for a single pin (store page). */
  singleZoom?: number;
};

/** Pins that share a spot (kiosk + showroom in one mall) are nudged apart so both show. */
export function spreadOverlapping(pins: StoreMapPin[]): StoreMapPin[] {
  const seen = new Map<string, number>();
  return pins.map((pin) => {
    const key = `${pin.latitude.toFixed(5)},${pin.longitude.toFixed(5)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return n === 0 ? pin : { ...pin, latitude: pin.latitude + n * 0.00035, longitude: pin.longitude + n * 0.00035 };
  });
}

export function pinBounds(pins: StoreMapPin[]) {
  return pins.reduce(
    (b, p) => ({
      north: Math.max(b.north, p.latitude),
      south: Math.min(b.south, p.latitude),
      east: Math.max(b.east, p.longitude),
      west: Math.min(b.west, p.longitude),
    }),
    { north: -90, south: 90, east: -180, west: 180 },
  );
}
