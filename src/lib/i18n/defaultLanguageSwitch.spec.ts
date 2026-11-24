import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT ${to}`);
});
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

const { defaultLanguageAddress, isPublishedIn, showInDefaultLanguage } = await import("./defaultLanguageSwitch");
import type { LocaleConfig } from "./locales";

const EN_AR: LocaleConfig = { locales: ["en", "ar"], defaultLocale: "en" };
const AR_EN: LocaleConfig = { locales: ["ar", "en"], defaultLocale: "ar" };

describe("unpublished language: switch to the default language", () => {
  it("compares the published language by its primary language", () => {
    expect(isPublishedIn("en-us", "en")).toBe(true);
    expect(isPublishedIn("ar", "ar")).toBe(true);
    expect(isPublishedIn("en", "ar")).toBe(false);
    expect(isPublishedIn(null, "ar")).toBe(false);
  });

  it("points at the same page in the market's default language", () => {
    expect(defaultLanguageAddress("/", "ar", EN_AR)).toBe("/");
    expect(defaultLanguageAddress("/pages/about-us", "ar", EN_AR)).toBe("/pages/about-us");
    // A market whose default is Arabic: an English page not published goes to the Arabic one.
    expect(defaultLanguageAddress("/faq", "en", AR_EN)).toBe("/faq");
    expect(defaultLanguageAddress("/faq", "en", EN_AR)).toBeNull();
  });

  it("redirects only outside the default language (never a loop)", () => {
    expect(() => showInDefaultLanguage("/our-story", "ar", EN_AR)).toThrow("NEXT_REDIRECT /our-story");
    redirect.mockClear();
    showInDefaultLanguage("/our-story", "en", EN_AR);
    expect(redirect).not.toHaveBeenCalled();
  });
});
