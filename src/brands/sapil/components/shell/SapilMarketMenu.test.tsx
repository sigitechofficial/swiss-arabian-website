import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SapilMarketMenu } from "./SapilMarketMenu";

const state = vi.hoisted(() => ({
  market: {
    marketId: "SAPIL_URD1" as string | null,
    setMarketId: vi.fn(),
    regionOptions: [
      { id: "SAPIL_URD1", label: "UAE", countryCode: "AE", flag: "🇦🇪" },
      { id: "SAPIL_KSA", label: "KSA", countryCode: "SA", flag: "🇸🇦" },
    ],
    languageOptions: [
      { id: "en", label: "English", lang: "en" },
      { id: "ar", label: "العربية", lang: "ar" },
    ],
  },
  setLanguageId: vi.fn(),
}));

vi.mock("@/providers/MarketProvider", () => ({ useMarket: () => state.market }));
vi.mock("@/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ languageId: "en", setLanguageId: state.setLanguageId }),
}));

const ALL_REGIONS = [...state.market.regionOptions];
const ALL_LANGUAGES = [...state.market.languageOptions];

beforeEach(() => {
  state.market.setMarketId.mockReset();
  state.setLanguageId.mockReset();
  state.market.regionOptions = [...ALL_REGIONS];
  state.market.languageOptions = [...ALL_LANGUAGES];
});

describe("SapilMarketMenu", () => {
  it("shows the current market and language and opens the choices", () => {
    render(<SapilMarketMenu />);
    const trigger = screen.getByRole("button", { name: "Country and language: UAE, English" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const ship = screen.getByRole("group", { name: "Ship to" });
    expect(within(ship).getByRole("button", { name: "UAE" })).toHaveAttribute("aria-current", "true");
    expect(within(ship).getByRole("button", { name: "KSA" })).not.toHaveAttribute("aria-current");
  });

  it("switches the market and closes", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Country and language/ }));
    fireEvent.click(screen.getByRole("button", { name: "KSA" }));
    expect(state.market.setMarketId).toHaveBeenCalledWith("SAPIL_KSA");
    expect(screen.queryByRole("group", { name: "Ship to" })).toBeNull();
  });

  it("choosing the current market changes nothing", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Country and language/ }));
    fireEvent.click(screen.getByRole("button", { name: "UAE" }));
    expect(state.market.setMarketId).not.toHaveBeenCalled();
  });

  it("switches the language", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Country and language/ }));
    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    expect(state.setLanguageId).toHaveBeenCalledWith("ar");
  });

  it("closes on Escape and returns focus to the chip", () => {
    render(<SapilMarketMenu />);
    const trigger = screen.getByRole("button", { name: /Country and language/ });
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("is hidden when there is one market and one language", () => {
    state.market.regionOptions = [ALL_REGIONS[0]];
    state.market.languageOptions = [ALL_LANGUAGES[0]];
    const { container } = render(<SapilMarketMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it("with one language, lists only the markets", () => {
    state.market.languageOptions = [ALL_LANGUAGES[0]];
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Country and language/ }));
    expect(screen.getByRole("group", { name: "Ship to" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
  });
});
