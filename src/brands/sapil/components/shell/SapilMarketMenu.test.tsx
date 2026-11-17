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
  it("shows two dropdowns: the market and the language", () => {
    render(<SapilMarketMenu />);
    expect(screen.getByRole("button", { name: "Ship to: UAE" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Language: English" })).toHaveAttribute("aria-expanded", "false");
  });

  it("the market dropdown lists the markets and switches", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ship to: UAE" }));
    const list = screen.getByRole("listbox", { name: "Ship to" });
    expect(within(list).getByRole("option", { name: "UAE" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(within(list).getByRole("option", { name: "KSA" }));
    expect(state.market.setMarketId).toHaveBeenCalledWith("SAPIL_KSA");
    expect(screen.queryByRole("listbox", { name: "Ship to" })).toBeNull();
  });

  it("choosing the current market changes nothing", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ship to: UAE" }));
    fireEvent.click(screen.getByRole("option", { name: "UAE" }));
    expect(state.market.setMarketId).not.toHaveBeenCalled();
  });

  it("the language dropdown switches the language", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Language: English" }));
    fireEvent.click(screen.getByRole("option", { name: "العربية" }));
    expect(state.setLanguageId).toHaveBeenCalledWith("ar");
  });

  it("closes on Escape and returns focus to the chip", () => {
    render(<SapilMarketMenu />);
    const trigger = screen.getByRole("button", { name: "Ship to: UAE" });
    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("one market still shows its dropdown (as on Swiss Arabian)", () => {
    state.market.regionOptions = [ALL_REGIONS[0]];
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ship to: UAE" }));
    expect(within(screen.getByRole("listbox", { name: "Ship to" })).getAllByRole("option")).toHaveLength(1);
  });

  it("only one dropdown opens at a time when the other is clicked", () => {
    render(<SapilMarketMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ship to: UAE" }));
    fireEvent.mouseDown(screen.getByRole("button", { name: "Language: English" }));
    fireEvent.click(screen.getByRole("button", { name: "Language: English" }));
    expect(screen.queryByRole("listbox", { name: "Ship to" })).toBeNull();
    expect(screen.getByRole("listbox", { name: "Language" })).toBeInTheDocument();
  });

  it("renders nothing before the markets are known", () => {
    state.market.regionOptions = [];
    state.market.languageOptions = [];
    const { container } = render(<SapilMarketMenu />);
    expect(container).toBeEmptyDOMElement();
  });
});
