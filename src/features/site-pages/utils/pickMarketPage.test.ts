import { describe, expect, it } from "vitest";
import type { SitePageListItem } from "../api/sitePages.service";
import {
  fixedPathForPage,
  pickFaqPage,
  pickStoresPage,
  pickStoryPage,
} from "./pickMarketPage";

const page = (
  handle: string,
  kind: "PAGE" | "POLICY" = "PAGE",
): SitePageListItem => ({
  kind,
  handle,
  path: `/${kind === "PAGE" ? "pages" : "policies"}/${handle}`,
  locales: ["en"],
  titles: { en: handle },
  updatedAt: "2026-11-10T00:00:00.000Z",
});

describe("pickFaqPage", () => {
  it("prefers faqs, then faq", () => {
    expect(pickFaqPage([page("faq"), page("faqs")])?.handle).toBe("faqs");
    expect(pickFaqPage([page("faq-old"), page("faq")])?.handle).toBe("faq");
  });

  it("takes another faq page when the store renamed it (Qatar faqs-1)", () => {
    expect(pickFaqPage([page("contact"), page("faqs-1")])?.handle).toBe(
      "faqs-1",
    );
  });

  it("ignores policies and returns null without an FAQ", () => {
    expect(pickFaqPage([page("faq", "POLICY"), page("about")])).toBeNull();
  });
});

describe("pickStoryPage / pickStoresPage", () => {
  it("finds the story and store pages by their store addresses", () => {
    expect(pickStoryPage([page("our-story-1")])?.handle).toBe("our-story-1");
    expect(pickStoryPage([page("about-us"), page("our-story")])?.handle).toBe(
      "our-story",
    );
    expect(pickStoresPage([page("locator")])?.handle).toBe("locator");
    expect(
      pickStoresPage([page("store-locator"), page("stores")])?.handle,
    ).toBe("store-locator");
    expect(pickStoryPage([page("faqs")])).toBeNull();
  });
});

describe("fixedPathForPage", () => {
  const pages = [page("faqs-1"), page("our-story-1"), page("contact")];

  it("gives the fixed address of the market's FAQ and story pages", () => {
    expect(fixedPathForPage(pages, "faqs-1")).toBe("/faq");
    expect(fixedPathForPage(pages, "our-story-1")).toBe("/our-story");
  });

  it("leaves other pages at their own address", () => {
    expect(fixedPathForPage(pages, "contact")).toBeNull();
    expect(fixedPathForPage([page("faqs"), page("faqs-1")], "faqs-1")).toBeNull();
  });
});
