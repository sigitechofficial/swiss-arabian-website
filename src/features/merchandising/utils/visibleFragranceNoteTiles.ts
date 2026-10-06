import type { FragranceNoteTile, FragranceNotesView } from "../types/merch";

export function visibleFragranceNoteTiles(
  data: FragranceNotesView | null | undefined,
): FragranceNoteTile[] {
  if (!data?.available || !data.tiles.length) return [];

  return data.tiles
    .filter((tile) => tile.fragranceFamily?.trim())
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function fragranceNotesPlpHref(fragranceFamily: string): string {
  const code = fragranceFamily.trim();
  const params = new URLSearchParams();
  if (code) params.set("fragranceFamily", code);
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}
