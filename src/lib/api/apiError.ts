export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
  context?: Record<string, unknown>;
};

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  context?: Record<string, unknown>;
  requestId?: string;
  /** The response's `data` on a failure: the facts behind it (e.g. how many are in stock). */
  data?: unknown;

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
    }
  }
}
