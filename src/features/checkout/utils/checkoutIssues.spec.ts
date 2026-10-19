import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api/apiError";

import { checkoutErrorMessage } from "./checkoutIssues";

describe("checkoutErrorMessage", () => {
  it("sends the customer back to the bag when a free gift sold out", () => {
    const error = new ApiClientError(409, { code: "ORDER_GIFT_OUT_OF_STOCK", message: "raw" });
    expect(checkoutErrorMessage(error)).toBe(
      "Your free gift just went out of stock. Go back to your bag to choose another gift.",
    );
  });
});
