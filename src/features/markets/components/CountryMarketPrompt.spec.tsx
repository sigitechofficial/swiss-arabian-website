import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import type { MessageDictionary } from "@/lib/i18n/messages";

const nav = vi.hoisted(() => ({ pathname: "/collections" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const market = vi.hoisted(() => ({
  marketId: "URD1" as string | null,
  setMarketId: vi.fn(),
  regionOptions: [
    { id: "URD1", label: "UAE", countryCode: "AE" },
    { id: "KSA", label: "KSA", countryCode: "SA" },
  ],
}));
vi.mock("@/providers/MarketProvider", () => ({ useOptionalMarket: () => market }));

import { CountryMarketPrompt } from "./CountryMarketPrompt";
import { answerCountrySuggestion } from "@/features/markets/utils/zoneCookie";
import { SapilCountryPrompt } from "@/brands/sapil/components/shell/SapilCountryPrompt";

function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

function inLocale(locale: "en" | "ar", ui: ReactNode) {
  const messages = (locale === "ar" ? { ...en, ...ar } : en) as unknown as MessageDictionary;
  return render(
    <ShopLocaleProvider locale={locale} messages={messages}>
      {ui}
    </ShopLocaleProvider>,
  );
}

beforeEach(() => {
  clearCookies();
  nav.pathname = "/collections";
  market.marketId = "URD1";
  market.setMarketId.mockReset();
});
afterEach(clearCookies);

describe("CountryMarketPrompt", () => {
  it("suggests the country's market and switches only when the shopper accepts", () => {
    document.cookie = "sa-country-market=KSA; Path=/";
    inLocale("en", <CountryMarketPrompt />);
    expect(screen.getByRole("dialog", { name: "Shopping from Saudi Arabia?" })).toBeTruthy();
    expect(market.setMarketId).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Switch to KSA" }));
    expect(market.setMarketId).toHaveBeenCalledWith("KSA");
  });

  it("stays in the market in use and does not ask again for that market", () => {
    document.cookie = "sa-country-market=KSA; Path=/";
    inLocale("en", <CountryMarketPrompt />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Stay in UAE" }));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.cookie).toContain("sa-country-prompt=KSA");
    expect(market.setMarketId).not.toHaveBeenCalled();
  });

  it("a market chosen with the picker answers the suggestion (no prompt right after choosing UAE in KSA)", () => {
    document.cookie = "sa-country-market=KSA; Path=/";
    answerCountrySuggestion("URD1");
    inLocale("en", <CountryMarketPrompt />);
    expect(screen.queryByRole("dialog")).toBeNull();
    // Choosing the country's own market is not a "no".
    document.cookie = "sa-country-prompt=; Path=/; Max-Age=0";
    answerCountrySuggestion("KSA");
    expect(document.cookie).not.toContain("sa-country-prompt=");
  });

  it("shows nothing when the country's market is the one in use, or unknown", () => {
    document.cookie = "sa-country-market=URD1; Path=/";
    const { unmount } = inLocale("en", <CountryMarketPrompt />);
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    clearCookies();
    inLocale("en", <CountryMarketPrompt />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("never shows on checkout", () => {
    document.cookie = "sa-country-market=KSA; Path=/";
    nav.pathname = "/ar/checkout";
    inLocale("en", <CountryMarketPrompt />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("speaks Arabic on Arabic pages", () => {
    document.cookie = "sa-country-market=KSA; Path=/";
    inLocale("ar", <CountryMarketPrompt />);
    expect(screen.getByRole("button", { name: "الانتقال إلى KSA" })).toBeTruthy();
    expect(screen.getByRole("dialog").textContent).toMatch(/السعودية/);
  });

  it("a brand's own prompt replaces the default one (one prompt on screen)", () => {
    document.cookie = "sa-country-market=KSA; Path=/";
    inLocale(
      "en",
      <>
        <CountryMarketPrompt />
        <SapilCountryPrompt />
      </>,
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Switch to KSA" }));
    expect(market.setMarketId).toHaveBeenCalledWith("KSA");
  });
});
