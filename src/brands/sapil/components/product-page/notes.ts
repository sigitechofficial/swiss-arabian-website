import type { StorefrontPdpMetafields } from "@/features/catalog/types/pdpMetafields";
import { noteNames } from "@/features/catalog/utils/pdpMetafields";
import type { SapilPastel } from "../../ui/shared";

export type NoteLayer = "top" | "heart" | "base";
export type NoteRow = { layer: NoteLayer; notes: string[] };

/** Top / heart / base notes from the product's fragrance metafields (layers without notes are left out). */
export function noteRows(metafields: StorefrontPdpMetafields | null | undefined): NoteRow[] {
  const rows: NoteRow[] = [
    { layer: "top", notes: noteNames(metafields?.top_note) },
    { layer: "heart", notes: noteNames(metafields?.middle_note) },
    { layer: "base", notes: noteNames(metafields?.base_note) },
  ];
  return rows.filter((r) => r.notes.length > 0);
}

/**
 * v9 note colours: each note is tinted by what it is, with a small glyph
 * (citrus, fruit, flower, sweet, wood, musk, green, spice). Presentation only.
 */
const TONES: Array<[RegExp, SapilPastel, string]> = [
  [/lemon|citrus|bergamot|orange(?! blossom)|grapefruit|mandarin|lime|yuzu/i, "butter", "◐"],
  [/berr|strawberr|cherr|fruit|apple|peach|pear|pineapple|coconut|plum|fig|mango|lychee|passion|melon|pomegranate|apricot|gumm/i, "pink", "●"],
  [/rose|jasmine|peony|gardenia|flower|floral|lily|violet|lavender|blossom|iris|tuberose|freesia|magnolia|orchid|neroli|ylang|lotus|heliotrope/i, "lilac", "✿"],
  [/vanilla|caramel|tonka|pistachio|praline|sugar|honey|chocolate|candy|almond|coffee|cream|marshmallow|toffee/i, "peach", "◆"],
  [/oud|wood|sandal|cedar|vetiver|patchouli|leather|smok|incense|guaiac|birch/i, "sand", "▲"],
  [/musk|amber|ambergris|ambrox/i, "sky", "○"],
  [/mint|green|tea|aquatic|marine|sea|ozon|water|basil|leaf/i, "mint", "❋"],
  [/saffron|pepper|cardamom|spice|cinnamon|clove|ginger|nutmeg/i, "sage", "✦"],
];

export function noteTone(note: string): { color: SapilPastel; glyph: string } {
  const hit = TONES.find(([re]) => re.test(note));
  return hit ? { color: hit[1], glyph: hit[2] } : { color: "sand", glyph: "•" };
}
