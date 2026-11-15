import { beforeEach, describe, expect, it } from "vitest";
import {
  choiceCookieDomain,
  MARKET_CHOICE_COOKIE,
  marketChoiceCookie,
  marketChoiceCookieName,
  readZoneCookie,
  storedZoneFor,
  writeZoneCookie,
  ZONE_COOKIE,
  zoneCookieName,
} from "./zoneCookie";

describe("market cookie per brand", () => {
  beforeEach(() => {
    for (const name of ["sa-zone-code", "sapil-zone-code"]) document.cookie = `${name}=; Path=/; Max-Age=0`;
  });

  it("keeps Swiss Arabian's name and gives other brands their own", () => {
    expect(zoneCookieName("SWISS_ARABIAN")).toBe("sa-zone-code");
    expect(zoneCookieName("SAPIL")).toBe("sapil-zone-code");
    expect(zoneCookieName("NEW_BRAND")).toBe("new-brand-zone-code");
  });

  it("reads and writes only this build's cookie", () => {
    // Another brand on the same host (cookies are shared across ports).
    const other = ZONE_COOKIE === "sa-zone-code" ? "sapil-zone-code" : "sa-zone-code";
    document.cookie = `${other}=FOREIGN_ZONE; Path=/`;
    expect(readZoneCookie()).toBeNull();
    writeZoneCookie("URD1");
    expect(readZoneCookie()).toBe("URD1");
  });

  it("ignores a stored zone that isn't one of the brand's markets", () => {
    expect(storedZoneFor("SAPIL_URD1", ["URD1", "QAR1"])).toBeNull();
    expect(storedZoneFor(" QAR1 ", ["URD1", "QAR1"])).toBe("QAR1");
    expect(storedZoneFor(null, ["URD1"])).toBeNull();
  });
});

describe("market choice kept on the brand's domain (root domain sends the shopper back)", () => {
  it("has its own name per brand, apart from the per-address cookie", () => {
    expect(marketChoiceCookieName("SWISS_ARABIAN")).toBe("sa-market-choice");
    expect(marketChoiceCookieName("SAPIL")).toBe("sapil-market-choice");
  });

  it("is kept on the brand domain only when this page is that domain or under it", () => {
    expect(choiceCookieDomain("swissarabian.com", "ksa.swissarabian.com")).toBe("swissarabian.com");
    expect(choiceCookieDomain("SwissArabian.com", "swissarabian.com")).toBe("swissarabian.com");
    expect(choiceCookieDomain("staging.swissarabian.com", "ksa.staging.swissarabian.com")).toBe(
      "staging.swissarabian.com",
    );
    // Never a domain the browser would refuse, or a look-alike, or local aliases.
    expect(choiceCookieDomain("swissarabian.com", "uae.sapil.com")).toBeNull();
    expect(choiceCookieDomain("swissarabian.com", "evilswissarabian.com")).toBeNull();
    expect(choiceCookieDomain("localhost", "ksa.localhost")).toBeNull();
    expect(choiceCookieDomain(null, "ksa.swissarabian.com")).toBeNull();
  });

  it("writes Domain and Secure on the live websites, host-only locally", () => {
    expect(
      marketChoiceCookie("KSA", { brandDomain: "swissarabian.com", pageHost: "uae.swissarabian.com", secure: true }),
    ).toBe(`${MARKET_CHOICE_COOKIE}=KSA; Path=/; Max-Age=31536000; SameSite=Lax; Domain=swissarabian.com; Secure`);
    expect(
      marketChoiceCookie("KSA", { brandDomain: "swissarabian.com", pageHost: "ksa.localhost", secure: false }),
    ).toBe(`${MARKET_CHOICE_COOKIE}=KSA; Path=/; Max-Age=31536000; SameSite=Lax`);
  });
});
