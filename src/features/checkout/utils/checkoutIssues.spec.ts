import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api/apiError";

import { checkoutErrorMessage, checkoutWarningMessages } from "./checkoutIssues";

describe("checkoutErrorMessage", () => {
  it("sends the customer back to the bag when a free gift sold out", () => {
    const error = new ApiClientError(409, { code: "ORDER_GIFT_OUT_OF_STOCK", message: "raw" });
    expect(checkoutErrorMessage(error)).toBe(
      "Your free gift just went out of stock. Go back to your bag to choose another gift.",
    );
  });
});

describe("checkoutWarningMessages", () => {
  it("shows shopper warnings and hides internal back-office notices", () => {
    expect(
      checkoutWarningMessages([
        { issueType: "ITEM_PRICE_CHANGED", severity: "WARNING", message: "raw" },
        {
          issueType: "CUSTOMER_D365_MAPPING_MISSING",
          severity: "WARNING",
          message: "Customer D365 mapping is missing; order posting may require manual review later",
        },
      ] as never),
    ).toEqual(["Prices have been updated since you added these items."]);
  });
});
