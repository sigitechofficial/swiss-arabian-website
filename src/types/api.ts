/** Shared API envelope used by store backends. */
export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  meta?: unknown;
};
