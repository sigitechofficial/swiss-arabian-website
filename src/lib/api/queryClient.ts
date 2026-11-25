"use client";

import { QueryClient } from "@tanstack/react-query";
import { retryTransientFailure } from "./queryRetry";

/** A query client with the storefront's defaults (exported for tests). */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
        // One retry, and only when asking again can help: a 404 or a missing
        // market is the server's answer, not a failure to repeat.
        retry: retryTransientFailure,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/** Browser singleton for session teardown / imperative clears. */
export const queryClient =
  typeof window !== "undefined" ? getQueryClient() : makeQueryClient();
