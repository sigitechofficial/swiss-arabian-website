export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, body?: ApiErrorBody | string) {
    const message =
      typeof body === "string"
        ? body
        : body?.message || `Request failed with status ${status}`;
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    if (typeof body === "object" && body) {
      this.code = body.code;
      this.details = body.details;
    }
  }
}
