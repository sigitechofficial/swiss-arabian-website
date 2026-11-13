import { beforeEach, describe, expect, it } from "vitest";
import { readZoneCookie, storedZoneFor, writeZoneCookie, ZONE_COOKIE, zoneCookieName } from "./zoneCookie";

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
