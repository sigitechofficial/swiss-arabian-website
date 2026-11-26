import { ApiClientError } from "./apiError";

/**
 * Statuses that may answer differently a moment later: a timeout, a rate
 * limit, or the server failing / restarting. Every other 4xx is the server's
 * final answer (not found, no market chosen, invalid, forbidden): asking again
 * returns the same answer and only doubles the traffic.
 */
function isTransientStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

/** True when the same request may succeed if it is sent again. */
export function isTransientFailure(error: unknown): boolean {
  if (error instanceof ApiClientError) return isTransientStatus(error.status);
  // No answer at all (offline, connection reset, aborted by the browser).
  return true;
}

/**
 * React Query `retry` that repeats a read only when the failure is transient,
 * at most `maxRetries` times. The query client's default; a hook passes its own
 * only to allow more (or no) retries.
 */
export function retryTransientFailures(maxRetries: number) {
  return (failureCount: number, error: unknown): boolean =>
    failureCount < maxRetries && isTransientFailure(error);
}

/** The storefront's default: one retry, for transient failures only. */
export const retryTransientFailure = retryTransientFailures(1);
