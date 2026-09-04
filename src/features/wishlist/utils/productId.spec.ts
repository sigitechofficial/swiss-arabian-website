import { describe, expect, it } from "vitest";
import {
  chunkProductIds,
  isProductUuid,
  uniqueProductUuids,
  WISHLIST_STATUS_BATCH_SIZE,
} from "./productId";

const UUID_A = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const UUID_B = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("wishlist productId", () => {
  it("accepts catalog UUIDs and rejects slug/SKU", () => {
    expect(isProductUuid(UUID_A)).toBe(true);
    expect(isProductUuid("patchouli-01")).toBe(false);
    expect(isProductUuid("BCED141201")).toBe(false);
    expect(isProductUuid("")).toBe(false);
  });

  it("dedupes and sorts UUIDs", () => {
    expect(uniqueProductUuids([UUID_B, UUID_A, UUID_A, "oud"])).toEqual([
      UUID_A,
      UUID_B,
    ]);
  });

  it("chunks status ids at 50", () => {
    const ids = Array.from({ length: 51 }, (_, index) => {
      const n = String(index + 1).padStart(12, "0");
      return `3fa85f64-5717-4562-b3fc-${n}`;
    });
    const chunks = chunkProductIds(ids);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(WISHLIST_STATUS_BATCH_SIZE);
    expect(chunks[1]).toHaveLength(1);
  });
});
