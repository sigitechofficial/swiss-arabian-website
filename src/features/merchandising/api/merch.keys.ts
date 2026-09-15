export const merchKeys = {
  all: ["merchandising"] as const,
  collection: (slug: string, zone?: string | null, currency?: string | null) =>
    [...merchKeys.all, "collection", slug, zone ?? "default", currency ?? "default"] as const,
};
