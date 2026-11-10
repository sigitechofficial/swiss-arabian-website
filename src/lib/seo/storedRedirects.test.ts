import { describe, expect, it } from "vitest";
import {
  matchRedirect,
  normalizeRequestPath,
  redirectLocation,
} from "./storedRedirects";

const map = new Map([
  ["/collections/old-oud", "/collections/oud"],
  ["/pages/story", "https://example.com/story"],
  ["/ar/collections/types", "/ar/collections"],
  ["/collections/home", "/"],
]);

describe("normalizeRequestPath", () => {
  it("matches the stored form", () => {
    expect(normalizeRequestPath("/Collections/Old-Oud/")).toBe(
      "/collections/old-oud",
    );
    expect(normalizeRequestPath("/products/%D8%B9%D9%88%D8%AF")).toBe(
      "/products/عود",
    );
  });
});

describe("matchRedirect", () => {
  it("finds the redirect for the old path", () => {
    expect(matchRedirect(map, "/Collections/old-oud/")).toBe(
      "/collections/oud",
    );
    expect(matchRedirect(map, "/collections/oud")).toBeNull();
  });

  it("uses an Arabic redirect first, else keeps /ar on the English one", () => {
    expect(matchRedirect(map, "/ar/collections/types")).toBe("/ar/collections");
    expect(matchRedirect(map, "/ar/collections/old-oud")).toBe(
      "/ar/collections/oud",
    );
    expect(matchRedirect(map, "/ar/collections/home")).toBe("/ar");
    expect(matchRedirect(map, "/ar/pages/story")).toBe(
      "https://example.com/story",
    );
  });
});

describe("redirectLocation", () => {
  const request = new URL(
    "https://uae.swissarabian.com/collections/old-oud?utm_source=ig",
  );

  it("keeps the query on a site target", () => {
    expect(redirectLocation("/collections/oud", request).toString()).toBe(
      "https://uae.swissarabian.com/collections/oud?utm_source=ig",
    );
  });

  it("keeps the target's own query and other sites as they are", () => {
    expect(
      redirectLocation("/collections/oud?sort=new", request).toString(),
    ).toBe("https://uae.swissarabian.com/collections/oud?sort=new");
    expect(
      redirectLocation("https://example.com/story", request).toString(),
    ).toBe("https://example.com/story");
  });
});
