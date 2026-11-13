import { describe, expect, it, vi } from "vitest";
import { getTranslator } from "@/lib/i18n/messages";

const locale = vi.hoisted(() => ({ value: "en" as "en" | "ar" }));

vi.mock("@/lib/i18n/routeLocale", () => ({
  routeTranslator: async () => ({ t: await getTranslator(locale.value) }),
}));
vi.mock("@brand-ui", () => ({ CheckoutPageView: () => null }));

import { generateMetadata } from "@/app/[locale]/(checkout)/checkout/page";

describe("checkout page title", () => {
  it("is translated, not just the brand name", async () => {
    locale.value = "en";
    expect((await generateMetadata()).title).toBe("Checkout");
    locale.value = "ar";
    expect((await generateMetadata()).title).toBe("إتمام الشراء");
  });
});
