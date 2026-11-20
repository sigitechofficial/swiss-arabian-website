export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
  context?: Record<string, unknown>;
};

/**
 * Failures the shop itself reports (no answer from the server to show): worded
 * in the shop's message files, like the server's codes it words itself.
 */
export const CLIENT_ERROR_CODES = {
  /** The server could not be reached (offline, timeout, 5xx on refresh). */
  unreachable: "SHOP_UNREACHABLE",
  /** The session ended and could not be renewed: sign in again. */
  sessionEnded: "SESSION_EXPIRED",
  /** The server answered with something that is not the API envelope. */
  unexpectedResponse: "UNEXPECTED_RESPONSE",
} as const;

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  context?: Record<string, unknown>;
  requestId?: string;
  /** The response's `data` on a failure: the facts behind it (e.g. how many are in stock). */
  data?: unknown;
  /**
   * The server's sentence for the shopper (already in the page's language),
   * only when the answer was the API's error envelope. Never raw response text.
   */
  serverMessage?: string;

  constructor(
    status: number,
    body?: ApiErrorBody | string,
    requestId?: string,
    data?: unknown,
  ) {
    const message =
      typeof body === "string"
        ? body
        : body?.message || `Request failed with status ${status}`;
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.requestId = requestId;
    this.data = data ?? undefined;
    if (typeof body === "object" && body) {
      this.code = body.code;
      this.details = body.details;
      this.context = body.context;
      const said = body.message?.trim();
      if (said) this.serverMessage = said;
    }
  }
}
