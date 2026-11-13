import { describe, expect, it } from "vitest";
import { parseAnnouncementBar, parseFooterContent } from "./useCmsGlobalRegion";
import { publishedHomeState } from "./usePublishedHome";
import type { CmsHomeResult } from "../types/cmsHome.types";

const section = (type: string, data: Record<string, unknown>) => ({ id: type, type, position: 0, data });

describe("parseAnnouncementBar", () => {
  it("keeps trimmed messages with their links, and nothing when disabled", () => {
    const parsed = parseAnnouncementBar([
      section("ANNOUNCEMENT_BAR", {
        messages: [
          { message: "  New: The Scent Society ", link: { type: "INTERNAL_PATH", url: "/collections/x" } },
          { message: "   " },
          { message: "Free returns" },
        ],
        rotationIntervalMs: 5000,
        backgroundColor: "#dff3ea",
      }),
    ]);
    expect(parsed.items).toEqual([
      { message: "New: The Scent Society", link: { type: "INTERNAL_PATH", url: "/collections/x" } },
      { message: "Free returns", link: null },
    ]);
    expect(parsed.rotationIntervalMs).toBe(5000);
    expect(parsed.backgroundColor).toBe("#dff3ea");
    expect(parsed.textColor).toBeNull();
    expect(parseAnnouncementBar([section("ANNOUNCEMENT_BAR", { enabled: false, messages: [{ message: "x" }] })]).items).toEqual([]);
    expect(parseAnnouncementBar([]).items).toEqual([]);
  });
});

describe("parseFooterContent", () => {
  it("reads the footer region with safe defaults", () => {
    expect(parseFooterContent([])).toEqual({
      newsletterHeading: null,
      newsletterPlaceholder: null,
      newsletterButtonLabel: null,
      copyrightText: null,
      showPaymentBadges: true,
      socialLinks: [],
    });
    const parsed = parseFooterContent([
      section("FOOTER", {
        newsletterHeading: " Join ",
        copyrightText: "© Sapil",
        showPaymentBadges: false,
        socialLinks: [{ id: "ig", label: "Instagram", href: "https://instagram.com/sapil" }, null],
      }),
    ]);
    expect(parsed.newsletterHeading).toBe("Join");
    expect(parsed.copyrightText).toBe("© Sapil");
    expect(parsed.showPaymentBadges).toBe(false);
    expect(parsed.socialLinks).toHaveLength(1);
  });
});

describe("publishedHomeState", () => {
  const home: CmsHomeResult = {
    page: { type: "HOME", id: "p", variantId: "v", locale: "en-us", zoneCode: "Z" },
    sections: [section("HERO_GALLERY", {})],
  };
  it("loads until the market is known or the request settles", () => {
    expect(publishedHomeState({ shown: undefined, known: false, isPending: false, isError: false }).status).toBe("loading");
    expect(publishedHomeState({ shown: undefined, known: true, isPending: true, isError: false }).status).toBe("loading");
  });
  it("reports errors, empty homepages and ready ones", () => {
    expect(publishedHomeState({ shown: undefined, known: true, isPending: false, isError: true }).status).toBe("error");
    expect(publishedHomeState({ shown: { page: null, sections: [] }, known: true, isPending: false, isError: false }).status).toBe("empty");
    expect(publishedHomeState({ shown: home, known: true, isPending: false, isError: false })).toEqual({ status: "ready", data: home });
  });
});
