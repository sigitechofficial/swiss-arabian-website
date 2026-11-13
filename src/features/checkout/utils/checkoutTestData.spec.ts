import { describe, expect, it } from "vitest";
import { checkoutTestDataFor } from "./checkoutTestData";

describe("checkoutTestDataFor", () => {
  it("gives UAE test details to a guest outside production", () => {
    const data = checkoutTestDataFor({
      appEnv: "dev",
      isAuthenticated: false,
      countryCode: "ae",
    });
    expect(data?.shipping.city).toBe("Dubai");
    expect(data?.shipping.emirate).toBe("Dubai");
    expect(data?.shipping.phone).toBe("+971501234567");
    expect(data?.email).toMatch(/@example\.com$/);
  });

  it("gives KSA test details", () => {
    const data = checkoutTestDataFor({
      appEnv: "local",
      isAuthenticated: false,
      countryCode: "SA",
    });
    expect(data?.shipping.emirate).toBe("Riyadh");
    expect(data?.shipping.phone).toBe("+966501234567");
  });

  it("is hidden for other markets, signed-in shoppers and production", () => {
    expect(
      checkoutTestDataFor({
        appEnv: "dev",
        isAuthenticated: false,
        countryCode: "QA",
      }),
    ).toBeNull();
    expect(
      checkoutTestDataFor({
        appEnv: "dev",
        isAuthenticated: true,
        countryCode: "AE",
      }),
    ).toBeNull();
    expect(
      checkoutTestDataFor({
        appEnv: "production",
        isAuthenticated: false,
        countryCode: "AE",
      }),
    ).toBeNull();
  });
});
