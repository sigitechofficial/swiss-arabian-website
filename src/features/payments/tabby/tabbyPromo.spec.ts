import { describe, expect, it } from "vitest";
import { usableTabbyPromo, type TabbyPromoConfig } from "./tabbyPromo";

const uae: TabbyPromoConfig = {
  available: true,
  publicKey: "pk_test_x",
  merchantCode: "swissarabian_web_uae",
  currency: "AED",
  snippetScriptBase: "https://checkout.tabby.ai",
};

describe("usableTabbyPromo", () => {
  it("uses the market settings for a price in the market currency", () => {
    expect(usableTabbyPromo(uae, 230, "aed")).toBe(uae);
  });

  it("shows nothing where the market has no Tabby (Qatar)", () => {
    expect(usableTabbyPromo({ available: false }, 230, "QAR")).toBeNull();
  });

  it("shows nothing for another currency, no amount, or before settings load", () => {
    expect(usableTabbyPromo(uae, 230, "QAR")).toBeNull();
    expect(usableTabbyPromo(uae, 0, "AED")).toBeNull();
    expect(usableTabbyPromo(null, 230, "AED")).toBeNull();
  });

  it("never loads a script from a host that is not Tabby's", () => {
    expect(
      usableTabbyPromo({ ...uae, snippetScriptBase: "https://evil.example" }, 230, "AED"),
    ).toBeNull();
  });

  it("needs the merchant code and public key (required by Tabby's pop-up)", () => {
    expect(usableTabbyPromo({ ...uae, merchantCode: "" }, 230, "AED")).toBeNull();
    expect(usableTabbyPromo({ ...uae, publicKey: "" }, 230, "AED")).toBeNull();
  });
});
