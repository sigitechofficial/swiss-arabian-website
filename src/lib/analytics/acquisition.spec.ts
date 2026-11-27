import { describe, expect, it } from "vitest";
import { readAcquisition } from "./acquisition";

const at = (url: string) => {
  const u = new URL(url);
  return { search: u.search, pathname: u.pathname, host: u.host };
};

describe("landing acquisition", () => {
  it("a Facebook ad: campaign tags and that a click id was present, never its value", () => {
    const context = readAcquisition(
      at("https://uae.swissarabian.com/products/oud-1?utm_source=facebook&utm_medium=paid_social&utm_campaign=ramadan&utm_content=reel-2&fbclid=IwAR0secret"),
      "https://l.facebook.com/",
    );
    expect(context).toEqual({
      source: "facebook",
      medium: "paid_social",
      campaign: "ramadan",
      content: "reel-2",
      landingPath: "/products/oud-1",
      referrerHost: "l.facebook.com",
      fbclid: "1",
    });
    expect(JSON.stringify(context)).not.toContain("IwAR0secret");
  });

  it("a Google ad click without tags still says a Google click was present", () => {
    expect(readAcquisition(at("https://uae.swissarabian.com/?gclid=abc"), "")).toEqual({ landingPath: "/", gclid: "1" });
  });

  it("another site's link: only its host", () => {
    expect(readAcquisition(at("https://uae.swissarabian.com/collections/oud"), "https://www.google.com/search?q=oud+perfume")).toEqual({
      landingPath: "/collections/oud",
      referrerHost: "www.google.com",
    });
  });

  it("a typed address, a bookmark or our own page is Direct: nothing", () => {
    expect(readAcquisition(at("https://uae.swissarabian.com/"), "")).toBeNull();
    expect(readAcquisition(at("https://uae.swissarabian.com/cart"), "https://uae.swissarabian.com/products/oud-1")).toBeNull();
    expect(readAcquisition(at("https://uae.swissarabian.com/"), "android-app://com.example")).toBeNull();
  });

  it("a market on the shared address reports the page without the market segment", () => {
    expect(readAcquisition(at("https://swissarabian.com/~KWT/products/oud-1?utm_source=snapchat"), "")?.landingPath).toBe("/products/oud-1");
  });

  it("drops empty and over-long values instead of cutting them", () => {
    const long = "x".repeat(201);
    expect(readAcquisition(at(`https://uae.swissarabian.com/?utm_source=&utm_campaign=${long}&utm_medium=email`), "")).toEqual({
      landingPath: "/",
      medium: "email",
    });
  });
});
