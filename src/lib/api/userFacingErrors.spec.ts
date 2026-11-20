import { afterEach, describe, expect, it } from "vitest";
import { createTranslator, englishTranslator } from "@/lib/i18n/messages";
import { setPageTranslator } from "@/lib/i18n/pageTranslator";
import ar from "@/messages/ar.json";
import { ApiClientError, CLIENT_ERROR_CODES } from "./apiError";
import { getUserFacingErrorMessage, knownErrorMessage } from "./userFacingErrors";

const arabic = createTranslator("ar", ar);

describe("getUserFacingErrorMessage", () => {
  afterEach(() => setPageTranslator(englishTranslator));

  it("shows the server's sentence (it is already the shopper wording, in the page's language)", () => {
    const error = new ApiClientError(409, { code: "BAG_ORDER_PAID", message: "تم الدفع، لذا أصبحت هذه الحقيبة طلبًا." });
    expect(getUserFacingErrorMessage(error)).toBe("تم الدفع، لذا أصبحت هذه الحقيبة طلبًا.");
  });

  it("prefers the shop's own wording for codes it words itself, in the page's language", () => {
    setPageTranslator(arabic);
    const stock = new ApiClientError(
      400,
      { code: "CART_INSUFFICIENT_INVENTORY", message: "server wording" },
      undefined,
      { availableQty: "0" },
    );
    expect(getUserFacingErrorMessage(stock)).toBe(ar["error.stock.outOfStock"]);
    expect(getUserFacingErrorMessage(new ApiClientError(503, { code: CLIENT_ERROR_CODES.unreachable }))).toBe(
      ar["error.unreachable"],
    );
    expect(getUserFacingErrorMessage(new ApiClientError(401, { code: CLIENT_ERROR_CODES.sessionEnded }))).toBe(
      ar["error.sessionEnded"],
    );
  });

  it("never shows raw or technical text", () => {
    // Not the API envelope (an HTML error page, a proxy's text): the caller's words, else generic.
    expect(getUserFacingErrorMessage(new ApiClientError(502, "<html>502 Bad Gateway</html>"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getUserFacingErrorMessage(new ApiClientError(502, "nginx"), "We couldn’t save your address.")).toBe(
      "We couldn’t save your address.",
    );
    expect(getUserFacingErrorMessage(new ApiClientError(500, { code: "X" }))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getUserFacingErrorMessage(new Error("Cannot read properties of undefined"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getUserFacingErrorMessage(new TypeError("Failed to fetch"), undefined, arabic)).toBe(ar["error.unreachable"]);
  });

  it("knownErrorMessage is null when the failure has no sentence of its own", () => {
    expect(knownErrorMessage(new ApiClientError(502, "Bad gateway"))).toBeNull();
    expect(knownErrorMessage(new ApiClientError(404, { code: "ORDER_NOT_FOUND", message: "We couldn’t find this order." }))).toBe(
      "We couldn’t find this order.",
    );
  });
});
