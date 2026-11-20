import { afterEach, describe, expect, it } from "vitest";
import { createTranslator, englishTranslator } from "@/lib/i18n/messages";
import { setPageTranslator } from "@/lib/i18n/pageTranslator";
import ar from "@/messages/ar.json";
import { ApiClientError } from "./apiError";
import { getUserFacingErrorMessage } from "./userFacingErrors";

const error = (code: string, message = "server wording") =>
  new ApiClientError(409, { code, message } as never);

describe("getUserFacingErrorMessage", () => {
  afterEach(() => setPageTranslator(englishTranslator));

  it("uses the shop's wording for a bag whose payment is settling or done", () => {
    expect(getUserFacingErrorMessage(error("BAG_AWAITING_PAYMENT"))).toBe(
      englishTranslator("cart.bagPaymentConfirming"),
    );
    expect(getUserFacingErrorMessage(error("BAG_ORDER_PAID"))).toBe(englishTranslator("cart.bagOrderPaid"));
  });

  it("in the page's language", () => {
    setPageTranslator(createTranslator("ar", ar));
    expect(getUserFacingErrorMessage(error("BAG_ORDER_PAID"))).toBe(ar["cart.bagOrderPaid"]);
  });

  it("other errors keep the server's message", () => {
    expect(getUserFacingErrorMessage(error("SOMETHING_ELSE", "Something specific."))).toBe("Something specific.");
  });
});
