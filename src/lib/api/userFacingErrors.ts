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

function readCount(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return value != null && value !== "" && Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
}

/** "Only 6 available" — the bag asked for more than is in stock. */
export function insufficientStockMessage(data: unknown): string {
  const facts = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const available = readCount(facts.availableQty);
  const inBag = readCount(facts.inBagQty);
  if (available == null) return "Sorry, there isn’t enough stock for that quantity.";
  if (available === 0) return "Sorry, this item is out of stock.";
  if (inBag != null && inBag >= available) {
    return available === 1 ? "You already have the last one in your bag." : `You already have all ${available} in your bag.`;
  }
  const only = `Only ${available} available.`;
  return inBag ? `${only} You have ${inBag} in your bag.` : only;
}

export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === "CART_INSUFFICIENT_INVENTORY") {
    return insufficientStockMessage(error.data);
  }
  if (error instanceof ApiClientError) {
    return sanitizeUserFacingMessage(error.message);
  }
  if (error instanceof Error) {
    return sanitizeUserFacingMessage(error.message);
  }
  return "Something went wrong. Please try again.";
}
