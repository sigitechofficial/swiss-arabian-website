import { ApiClientError } from "@/lib/api/apiError";
import { redemptionReasonMessage } from "../types/loyalty";

export function loyaltyRedemptionErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const fromCode = redemptionReasonMessage(error.code);
    if (fromCode) return fromCode;
    const fromMessage = redemptionReasonMessage(error.message);
    if (fromMessage) return fromMessage;
    return error.message || "We couldn’t apply those reward points. Please try again.";
  }
  return "We couldn’t apply those reward points. Please try again.";
}
