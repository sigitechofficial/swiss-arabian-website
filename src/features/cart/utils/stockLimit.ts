import { insufficientStockMessage } from "@/lib/api/userFacingErrors";
import type { CartLine } from "@/stores/useCartStore";

/** The line already holds every unit in stock, so + has nothing left to add. */
export function atStockLimit(line: Pick<CartLine, "quantity" | "maxQuantity">): boolean {
  return line.maxQuantity != null && line.quantity >= line.maxQuantity;
}

/** What Add to bag says when the bag already holds all of it; same words as the server's refusal. */
export function fullLineMessage(maxQuantity: number): string {
  return insufficientStockMessage({ availableQty: maxQuantity, inBagQty: maxQuantity });
}

/** Shown under a line that has reached its stock limit. */
export function stockLimitNote(maxQuantity: number): string {
  return maxQuantity === 1 ? "Only 1 available" : `Only ${maxQuantity} available`;
}
