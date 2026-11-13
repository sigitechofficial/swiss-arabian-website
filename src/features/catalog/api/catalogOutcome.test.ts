import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/apiClient", () => ({ apiGet }));

import {
  fetchCategoryBySlugOutcome,
  fetchCollectionBySlug,
  fetchCollectionBySlugOutcome,
  fetchProductBySlug,
  fetchProductBySlugOutcome,
  isCatalogUnavailable,
} from "./catalog.service";

beforeEach(() => {
  apiGet.mockReset();
});

describe("isCatalogUnavailable", () => {
  it("is true for network errors and 5xx, false for 4xx", () => {
    expect(isCatalogUnavailable(new TypeError("fetch failed"))).toBe(true);
    expect(isCatalogUnavailable(new ApiClientError(502, "Bad gateway"))).toBe(true);
    expect(isCatalogUnavailable(new ApiClientError(404, "Not found"))).toBe(false);
    expect(isCatalogUnavailable(new ApiClientError(400, "Bad request"))).toBe(false);
  });
});

describe("product by slug", () => {
  it("throws when the API is down, so the page shows an error, not 'not found'", async () => {
    apiGet.mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchProductBySlugOutcome("oud", "UAE")).rejects.toThrow("fetch failed");
    await expect(fetchProductBySlug("oud", "UAE")).rejects.toThrow("fetch failed");
  });

  it("throws on a 5xx", async () => {
    apiGet.mockRejectedValue(new ApiClientError(500, "Internal error"));
    await expect(fetchProductBySlugOutcome("oud", "UAE")).rejects.toBeInstanceOf(ApiClientError);
  });

  it("is missing only on a real 404 with no exact search match", async () => {
    apiGet
      .mockRejectedValueOnce(new ApiClientError(404, "Not found"))
      .mockResolvedValueOnce({ products: [] });
    await expect(fetchProductBySlugOutcome("oud", "UAE")).resolves.toEqual({ product: null, missing: true });
  });

  it("throws when the detail 404s but the search fallback can't be reached", async () => {
    apiGet
      .mockRejectedValueOnce(new ApiClientError(404, "Not found"))
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(fetchProductBySlugOutcome("oud", "UAE")).rejects.toThrow("fetch failed");
  });
});

describe("collection and category by slug", () => {
  it("throws on a network error or 5xx for the server page", async () => {
    apiGet.mockRejectedValue(new ApiClientError(503, "Unavailable"));
    await expect(fetchCollectionBySlugOutcome("oud", "UAE")).rejects.toBeInstanceOf(ApiClientError);
    await expect(fetchCategoryBySlugOutcome("men", "UAE")).rejects.toBeInstanceOf(ApiClientError);
  });

  it("reports a 404 as missing", async () => {
    apiGet.mockRejectedValue(new ApiClientError(404, "Not found"));
    await expect(fetchCollectionBySlugOutcome("oud", "UAE")).resolves.toEqual({ collection: null, missing: true });
    await expect(fetchCategoryBySlugOutcome("men", "UAE")).resolves.toEqual({ category: null, missing: true });
  });

  it("the client banner lookup stays quiet (the listing shows the error)", async () => {
    apiGet.mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchCollectionBySlug("oud", "UAE")).resolves.toBeNull();
  });
});
