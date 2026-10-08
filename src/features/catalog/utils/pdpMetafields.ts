import type { PdpNoteRow, StorefrontPdpMetafields } from "../types/pdpMetafields";

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function pickPdpMetafields(
  raw: unknown,
): StorefrontPdpMetafields | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const src = raw as Record<string, unknown>;
  const out: StorefrontPdpMetafields = {};
  const keys: (keyof StorefrontPdpMetafields)[] = [
    "top_note",
    "middle_note",
    "base_note",
    "fragrance_family_text",
    "fragrance_notes",
    "size",
    "ingredient_heading",
  ];
  for (const key of keys) {
    const value = src[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

/** Pyramid rows only when a note string exists. Never invent names. */
export function pyramidFromMetafields(
  metafields: StorefrontPdpMetafields | null | undefined,
): PdpNoteRow[] {
  if (!metafields) return [];
  const rows: PdpNoteRow[] = [];
  const top = text(metafields.top_note);
  const heart = text(metafields.middle_note);
  const base = text(metafields.base_note);
  if (top) rows.push({ level: "Top", names: top });
  if (heart) rows.push({ level: "Heart", names: heart });
  if (base) rows.push({ level: "Base", names: base });
  return rows;
}

export function familyChips(
  metafields: StorefrontPdpMetafields | null | undefined,
): string[] {
  const family = text(metafields?.fragrance_family_text);
  if (!family) return [];
  return family
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/** Named notes in a pyramid layer. "Pink pepper, Cumin" is two notes. */
function noteNames(value: string | null | undefined): string[] {
  const raw = text(value);
  if (!raw) return [];
  return raw
    .split(/[,/|·•]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * One chip from the top, heart, and base layers.
 * A missing layer is skipped. If the first name in a layer was already used, the next name in that layer is used.
 */
export function pyramidNoteChips(
  metafields: StorefrontPdpMetafields | null | undefined,
): string[] {
  const chosen: string[] = [];
  const seen = new Set<string>();
  for (const layer of [
    metafields?.top_note,
    metafields?.middle_note,
    metafields?.base_note,
  ]) {
    const name = noteNames(layer).find((part) => !seen.has(part.toLowerCase()));
    if (!name) continue;
    seen.add(name.toLowerCase());
    chosen.push(name);
  }
  return chosen;
}

export function notesSectionTitle(
  metafields: StorefrontPdpMetafields | null | undefined,
): string {
  return text(metafields?.ingredient_heading) ?? "Notes";
}
