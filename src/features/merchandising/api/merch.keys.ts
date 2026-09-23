export const merchKeys = {
  all: ["merchandising"] as const,
  collection: (slug: string, zone?: string | null, currency?: string | null) =>
    [...merchKeys.all, "collection", slug, zone ?? "default", currency ?? "default"] as const,
  shopableVideo: (
    zone?: string | null,
    currency?: string | null,
    language?: string | null,
    salesChannel?: string | null,
  ) =>
    [
      ...merchKeys.all,
      "shopable-video",
      zone ?? "default",
      currency ?? "default",
      language ?? "default",
      salesChannel ?? "default",
    ] as const,
  fragranceNotes: (
    zone?: string | null,
    currency?: string | null,
    language?: string | null,
    salesChannel?: string | null,
  ) =>
    [
      ...merchKeys.all,
      "fragrance-notes",
      zone ?? "default",
      currency ?? "default",
      language ?? "default",
      salesChannel ?? "default",
    ] as const,
};
