import { ApiClientError } from "./apiError";

const OPS_PHRASES = [
  /POST\s+\/[a-z0-9/_-]+/gi,
  /GET\s+\/[a-z0-9/_-]+/gi,
  /PATCH\s+\/[a-z0-9/_-]+/gi,
  /PUT\s+\/[a-z0-9/_-]+/gi,
  /DELETE\s+\/[a-z0-9/_-]+/gi,
];

export function sanitizeUserFacingMessage(message: string): string {
  let next = message;
  for (const pattern of OPS_PHRASES) {
    next = next.replace(pattern, "the request");
  }
  return next;
}

export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return sanitizeUserFacingMessage(error.message);
  }
  if (error instanceof Error) {
    return sanitizeUserFacingMessage(error.message);
  }
  return "Something went wrong. Please try again.";
}
