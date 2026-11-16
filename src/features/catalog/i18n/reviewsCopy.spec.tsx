import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import type { MessageDictionary } from "@/lib/i18n/messages";
import { useReviewsCopy } from "./reviewsCopy";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function copyIn(locale: "en" | "ar") {
  const messages = (locale === "ar" ? { ...en, ...ar } : en) as unknown as MessageDictionary;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ShopLocaleProvider locale={locale} messages={messages}>
      {children}
    </ShopLocaleProvider>
  );
  return renderHook(() => useReviewsCopy(), { wrapper }).result.current;
}

afterEach(() => vi.unstubAllEnvs());

describe("reviews wording (src/messages reviews.*)", () => {
  it("English: plurals and placeholders", () => {
    const copy = copyIn("en");
    expect(copy.count(1)).toBe("1 review");
    expect(copy.count(3)).toBe("3 reviews");
    expect(copy.openPhotos(1)).toBe("View 1 photo");
    expect(copy.showing(4, 9)).toBe("Showing 4 of 9");
    expect(copy.barLabel(5, 2)).toBe("5 stars: 2 reviews");
    expect(copy.ratings).toHaveLength(6);
    expect(copy.sorts.rating_high).toBe("Highest rating");
  });

  it("Arabic: same forms as the old hand-written copy", () => {
    const copy = copyIn("ar");
    expect(copy.count(1)).toBe("تقييم واحد");
    expect(copy.count(2)).toBe("تقييمان");
    expect(copy.count(5)).toBe("5 تقييمات");
    expect(copy.count(20)).toBe("20 تقييمًا");
    expect(copy.locale).toBe("ar");
  });

  it("the shop's reply names this deployment's brand", () => {
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_BRAND_CODE", "SAPIL");
    expect(copyIn("en").replied).toBe("Sapil replied");
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_BRAND_CODE", "SWISS_ARABIAN");
    expect(copyIn("en").replied).toBe("Swiss Arabian replied");
  });
});
