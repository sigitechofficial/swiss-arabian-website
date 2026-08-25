/** Shared envelope types. Prefer generated OpenAPI types when available. */

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: { requestId?: string; path?: string; timestamp?: string };
};

export type ApiErrorEnvelope = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};
