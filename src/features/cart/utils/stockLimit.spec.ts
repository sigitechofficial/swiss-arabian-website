import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage, insufficientStockMessage } from "@/lib/api/userFacingErrors";
import { atStockLimit, fullLineMessage, stockLimitNote } from "./stockLimit";

describe("bag line stock limit", () => {
  it("stops + once the line holds everything in stock", () => {
    expect(atStockLimit({ quantity: 6, maxQuantity: 6 })).toBe(true);
    expect(atStockLimit({ quantity: 5, maxQuantity: 6 })).toBe(false);
  });

  it("never limits a line whose stock is unknown", () => {
    expect(atStockLimit({ quantity: 40 })).toBe(false);
  });

  it("says how many are available", () => {
    expect(stockLimitNote(6)).toBe("Only 6 available");
    expect(stockLimitNote(1)).toBe("Only 1 available");
  });
});

describe("refused quantity messages", () => {
  it("raising the quantity in the bag above stock", () => {
    expect(insufficientStockMessage({ availableQty: "6", requestedQty: 7 })).toBe("Only 6 available.");
  });

  it("adding from a product page when the bag already holds all of it", () => {
    expect(insufficientStockMessage({ availableQty: "6", inBagQty: 6 })).toBe("You already have all 6 in your bag.");
    expect(insufficientStockMessage({ availableQty: "1", inBagQty: 1 })).toBe("You already have the last one in your bag.");
  });

  it("adding several when only some are left", () => {
    expect(insufficientStockMessage({ availableQty: "6", inBagQty: 4 })).toBe("Only 6 available. You have 4 in your bag.");
  });

  it("nothing in stock, or no numbers sent", () => {
    expect(insufficientStockMessage({ availableQty: "0", inBagQty: 0 })).toBe("Sorry, this item is out of stock.");
    expect(insufficientStockMessage(null)).toBe("Sorry, there isn’t enough stock for that quantity.");
  });

  it("is what a refused bag update shows, instead of the server's wording", () => {
    const error = new ApiClientError(
      400,
      { code: "CART_INSUFFICIENT_INVENTORY", message: "Insufficient inventory for SBTL104403: requested 7, available 6" },
      "req-1",
      { sku: "SBTL104403", requestedQty: 7, availableQty: "6" },
    );
    expect(getUserFacingErrorMessage(error)).toBe("Only 6 available.");
  });

  it("leaves every other error message as it was", () => {
    const error = new ApiClientError(400, { code: "CART_ITEM_NOT_SELLABLE", message: "Item X cannot be added to cart: blocked" });
    expect(getUserFacingErrorMessage(error)).toBe("Item X cannot be added to cart: blocked");
  });
});

describe("product page when the bag already holds all the stock", () => {
  it("uses the same words as the server's refusal", () => {
    expect(fullLineMessage(6)).toBe("You already have all 6 in your bag.");
  });
});
