const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const WISHLIST_STATUS_BATCH_SIZE = 50;
export const WISHLIST_LIST_PAGE_SIZE = 20;

/** Catalog platform UUID — never slug or SKU. */
export function isProductUuid(value: string | null | undefined): boolean {
  return Boolean(value && UUID_RE.test(value.trim()));
}

export function uniqueProductUuids(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    const trimmed = id.trim();
    if (!isProductUuid(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
  }
  return [...seen].sort();
}

export function chunkProductIds(
  ids: readonly string[],
  size = WISHLIST_STATUS_BATCH_SIZE,
): string[][] {
  const unique = uniqueProductUuids(ids);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += size) {
    chunks.push(unique.slice(i, i + size));
  }
  return chunks;
}
