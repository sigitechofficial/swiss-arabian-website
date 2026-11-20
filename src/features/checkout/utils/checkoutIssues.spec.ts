import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import { ApiClientError } from "@/lib/api/apiError";
import { createTranslator } from "@/lib/i18n/messages";
import { checkoutErrorMessage, checkoutIssueMessage, checkoutWarningMessages } from "./checkoutIssues";

const arabic = createTranslator("ar", ar);

describe("checkoutErrorMessage", () => {
  it("shows the server's wording of the refusal (already in the page's language)", () => {
    const error = new ApiClientError(409, {
      code: "ORDER_GIFT_OUT_OF_STOCK",
      message: "نفدت هديتك المجانية للتو. عد إلى حقيبتك لاختيار هدية أخرى.",
    });
    expect(checkoutErrorMessage(error)).toBe("نفدت هديتك المجانية للتو. عد إلى حقيبتك لاختيار هدية أخرى.");
  });

  it("uses the caller's words when the server sent no sentence", () => {
    expect(checkoutErrorMessage(new ApiClientError(502, "<html/>"), "We couldn’t start checkout.")).toBe(
      "We couldn’t start checkout.",
    );
  });
});

describe("checkoutIssueMessage", () => {
  it("words the blocking issue in the page's language", () => {
    expect(
      checkoutIssueMessage([{ issueType: "ADDRESS_INVALID", severity: "ERROR", message: "raw" }] as never, arabic),
    ).toBe(ar["checkout.issue.ADDRESS_INVALID"]);
  });

  it("an issue the shop does not word reads as the general sentence, never its raw text", () => {
    expect(checkoutIssueMessage([{ issueType: "UNKNOWN", severity: "ERROR", message: "raw" }] as never)).toBe(
      "Some details need attention before we can place your order.",
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
