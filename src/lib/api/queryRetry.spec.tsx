import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "./apiError";
import { makeQueryClient } from "./queryClient";
import { isTransientFailure, retryTransientFailure, retryTransientFailures } from "./queryRetry";

describe("isTransientFailure", () => {
  it.each([400, 401, 403, 404, 409, 422])("treats %i as the server's final answer", (status) => {
    expect(isTransientFailure(new ApiClientError(status))).toBe(false);
  });

  it("treats a missing market (400 STOREFRONT_ZONE_REQUIRED) as final", () => {
    expect(isTransientFailure(new ApiClientError(400, { code: "STOREFRONT_ZONE_REQUIRED" }))).toBe(false);
  });

  it.each([408, 429, 500, 502, 503, 504])("retries %i", (status) => {
    expect(isTransientFailure(new ApiClientError(status))).toBe(true);
  });

  it("retries when no answer came back (offline, reset)", () => {
    expect(isTransientFailure(new TypeError("Failed to fetch"))).toBe(true);
  });
});

describe("retryTransientFailures", () => {
  it("stops after the allowed number of retries", () => {
    const retry = retryTransientFailures(2);
    const error = new ApiClientError(503);
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it("defaults to one retry", () => {
    const error = new ApiClientError(503);
    expect(retryTransientFailure(0, error)).toBe(true);
    expect(retryTransientFailure(1, error)).toBe(false);
  });
});

describe("storefront query client", () => {
  function setup(error: unknown) {
    const client = makeQueryClient();
    // Same retry rule as the shop, without waiting a second between attempts.
    client.setQueryDefaults(["probe"], { retryDelay: 0 });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const queryFn = vi.fn(async () => {
      throw error;
    });
    const hook = renderHook(() => useQuery({ queryKey: ["probe"], queryFn }), { wrapper });
    return { queryFn, hook };
  }

  it("asks once when the answer is 404 (an empty home collection is not fetched twice)", async () => {
    const { queryFn, hook } = setup(new ApiClientError(404, { code: "COLLECTION_NOT_FOUND" }));
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("asks once more when the server failed", async () => {
    const { queryFn, hook } = setup(new ApiClientError(503));
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
