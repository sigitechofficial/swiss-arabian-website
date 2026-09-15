/** `data.pdpMetafields` on PDP only — listing cards do not include this. */
export type StorefrontPdpMetafields = {
  top_note?: string;
  middle_note?: string;
  base_note?: string;
  fragrance_family_text?: string;
  fragrance_notes?: string;
  size?: string;
  ingredient_heading?: string;
};

export type PdpNoteRow = {
  level: "Top" | "Heart" | "Base";
  names: string;
};
