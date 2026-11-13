import { describe, expect, it } from "vitest";
import { localHostAlias, localStorefrontForHost, parseLocalStorefronts } from "./localStorefront";

const local = { appEnv: "local", aliases: "sp=SAPIL@sapil.test" };

describe("local storefront aliases", () => {
  it("reads the first label of a *.localhost address", () => {
    expect(localHostAlias("sp.localhost:3004")).toBe("sp");
    expect(localHostAlias("SA.localhost")).toBe("sa");
    expect(localHostAlias("localhost:3004")).toBeNull();
    expect(localHostAlias("uae.swissarabian.com")).toBeNull();
  });

  it("maps sp.localhost to Sapil when running locally", () => {
    expect(localStorefrontForHost("sp.localhost:3004", local)).toEqual({
      brandCode: "SAPIL",
      host: "sapil.test",
    });
  });

  it("leaves sa.localhost and localhost on the .env storefront", () => {
    expect(localStorefrontForHost("sa.localhost:3004", local)).toBeNull();
    expect(localStorefrontForHost("localhost:3004", local)).toBeNull();
  });

  it("does nothing outside the local environment", () => {
    expect(localStorefrontForHost("sp.localhost:3004", { ...local, appEnv: "dev" })).toBeNull();
  });

  it("parses a custom alias list", () => {
    const map = parseLocalStorefronts("sp=sapil@https://sapil.test/, sa=SWISS_ARABIAN@uae.swissarabian.com");
    expect(map.get("sp")).toEqual({ brandCode: "SAPIL", host: "sapil.test" });
    expect(map.get("sa")).toEqual({ brandCode: "SWISS_ARABIAN", host: "uae.swissarabian.com" });
  });
});
