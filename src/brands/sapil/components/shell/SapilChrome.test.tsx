import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavItem } from "@/features/navigation/types/navigation";
import { toast } from "@/components/ui/Toaster";
import { useUiStore } from "@/stores/useUiStore";
import { SapilChrome } from "./SapilChrome";
import { emphasized } from "./SapilAnnouncement";

const nav = (id: string, type: NavItem["type"], href: string | null, children: NavItem[] = []): NavItem => ({ id, label: id, slug: null, type, href, children });
const loading = vi.hoisted(() => ({ region: false, markets: false }));
const navState = vi.hoisted(() => ({ shopByNav: undefined as unknown }));
const announce = vi.hoisted(() => ({
  items: [{ message: "New: The Scent Society", link: { type: "INTERNAL_PATH", url: "/collections/scent-society" } }] as unknown[],
}));
const settings = vi.hoisted(() => ({
  value: { zoneCode: "SAPIL_URD1", currencyCode: "AED", freeDeliveryThreshold: null as number | null, cashOnDelivery: null as boolean | null, priceEditTiers: [] as number[] },
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/blog", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/brand", async (orig) => {
  const actual = await orig<typeof import("@/lib/brand")>();
  const { sapil } = await import("@/lib/brand/brands/sapil");
  return { ...actual, getBrand: () => ({ ...sapil, integrations: {} }) };
});
vi.mock("@/providers/MarketProvider", () => {
  const market = { marketId: "SAPIL_URD1", setMarketId: vi.fn(), regionOptions: [{ id: "SAPIL_URD1", label: "Sapil UAE" }], languageOptions: [{ id: "en", label: "English", lang: "en" }, { id: "ar", label: "العربية", lang: "ar" }], contentLanguage: "en-us", catalogContext: null };
  return { useMarket: () => market, useOptionalMarket: () => market };
});
vi.mock("@/features/navigation", () => ({
  useNavigation: () => ({
    headerNav: [
      nav("Blogs", "URL", "/blog"),
      nav("Collections", "URL", "/collections", [nav("Sarab", "COLLECTION", "/collections/sarab")]),
    ],
    // undefined: a hook result without the field, like an older backend's payload
    ...(navState.shopByNav === undefined ? {} : { shopByNav: navState.shopByNav }),
    footerItems: [nav("Help", "URL", null, [nav("Track your order", "URL", "/track")])],
    isLoading: false,
  }),
}));
vi.mock("@/features/markets/hooks/useMarketSettings", () => ({ useMarketSettings: () => settings.value }));
vi.mock("@/features/markets/hooks/useStorefrontMarkets", () => ({
  useStorefrontMarkets: () => ({ data: loading.markets ? undefined : { markets: [] }, isError: false }),
}));
vi.mock("@/features/cms/hooks/useCmsGlobalRegion", () => ({
  useCmsGlobalRegion: () => ({ data: loading.region ? undefined : { sections: [] }, isError: false }),
  useAnnouncementBar: () => ({ items: announce.items, rotationIntervalMs: null, backgroundColor: null, textColor: null }),
  useFooterContent: () => ({ newsletterHeading: null, newsletterPlaceholder: null, newsletterButtonLabel: null, copyrightText: null, showPaymentBadges: true, socialLinks: [] }),
}));
vi.mock("@/hooks/useLanguageSwitch", () => ({ useLanguageSwitch: () => ({ languageId: "en", setLanguageId: vi.fn() }) }));
vi.mock("@/hooks/useCurrentUser", () => ({ useIsAuthenticated: () => false }));
vi.mock("@/features/search/hooks/useHeaderSearch", () => ({
  useHeaderSearch: () => ({ open: false, setOpen: vi.fn(), query: "", setQuery: vi.fn(), hits: [], search: { total: 0, isLoading: false, isError: false }, goToResults: vi.fn() }),
}));
vi.mock("@/brands/sapil/components/bag/SapilBagDrawer", () => ({ SapilBagDrawer: () => <div data-testid="bag" /> }));
vi.mock("@/features/promotions/components/GiftChoiceHost", () => ({ GiftChoiceHost: () => null }));

beforeEach(() => {
  settings.value = { ...settings.value, freeDeliveryThreshold: null, cashOnDelivery: null, priceEditTiers: [] };
  loading.region = false;
  loading.markets = false;
  navState.shopByNav = undefined;
  announce.items = [{ message: "New: The Scent Society", link: { type: "INTERNAL_PATH", url: "/collections/scent-society" } }];
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  HTMLDialogElement.prototype.showModal ??= function () {};
});

describe("emphasized", () => {
  it("bolds **words** in announcement messages", () => {
    render(<p data-testid="m">{emphasized("New: **The Scent Society** · now")}</p>);
    expect(screen.getByTestId("m").innerHTML).toBe("New: <b>The Scent Society</b> · now");
  });
});

describe("SapilChrome", () => {
  it("draws the v9 chrome from shared data, with no Swiss Arabian text", () => {
    const { container } = render(<SapilChrome>page</SapilChrome>);
    expect(screen.getByRole("link", { name: "New: The Scent Society" })).toHaveAttribute("href", "/collections/scent-society");
    const main = screen.getByRole("navigation", { name: "Main" });
    expect(within(main).getByRole("link", { name: "Blogs" })).toHaveAttribute("aria-current", "page");
    const shopBy = screen.getByRole("navigation", { name: "Shop by" });
    expect(within(shopBy).getByRole("link", { name: "Sarab" })).toHaveAttribute("href", "/collections/sarab");
    expect(screen.getByRole("link", { name: "Track your order" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bag, 0 items" })).toBeInTheDocument();
    expect(screen.getByTestId("bag")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/swiss arabian/i);
    // no market delivery data: the info text stays hidden (never hard-coded)
    expect(screen.queryByText(/Free delivery/)).toBeNull();
  });

  it("holds the announcement and Shop by rows' height while their data loads (no layout shift)", () => {
    loading.region = true;
    loading.markets = true;
    const { container, rerender } = render(<SapilChrome>page</SapilChrome>);
    expect(container.querySelector('[data-sapil-reserve="announce"]')).not.toBeNull();
    expect(container.querySelector('[data-sapil-reserve="shop-by"]')).not.toBeNull();
    expect(screen.queryByRole("navigation", { name: "Shop by" })).toBeNull();
    loading.region = false;
    loading.markets = false;
    rerender(<SapilChrome>page</SapilChrome>);
    expect(container.querySelector("[data-sapil-reserve]")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Shop by" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New: The Scent Society" })).toBeInTheDocument();
  });

  it("shows the market's free-delivery and cash-on-delivery note and its price edit chip", () => {
    settings.value = { ...settings.value, freeDeliveryThreshold: 100, cashOnDelivery: true, priceEditTiers: [50, 99, 199] };
    render(<SapilChrome>page</SapilChrome>);
    expect(screen.getByText("Free delivery over AED 100 · Pay on delivery")).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Shop by" })).getByRole("link", { name: "Under AED 99" })).toHaveAttribute("href", "/products?under=99");
  });

  it("opens the bag, search and phone menu, and shows shared toasts", () => {
    render(<SapilChrome>page</SapilChrome>);
    fireEvent.click(screen.getByRole("button", { name: "Bag, 0 items" }));
    expect(useUiStore.getState().cartOpen).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Search" })[0]);
    expect(useUiStore.getState().searchOpen).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).not.toHaveAttribute("inert");
    act(() => toast("Saved to wishlist"));
    expect(screen.getAllByRole("status").some((el) => el.textContent === "Saved to wishlist")).toBe(true);
  });

  it("draws the Shop by chips from the market's Shop-by menu: any linked item, in order, at most 8, sale chip last", () => {
    settings.value = { ...settings.value, priceEditTiers: [50, 99, 199] };
    navState.shopByNav = [
      nav("For her", "COLLECTION", "/collections/for-her"),
      nav("Find your mood", "URL", "/#mood"),
      nav("Gifts", "CATEGORY", "/categories/gifts"),
      nav("Sarab EDP", "PRODUCT", "/products/sarab-edp"),
      nav("No link", "GROUP_HEADER", null),
      ...Array.from({ length: 6 }, (_, i) => nav(`Extra ${i}`, "COLLECTION", `/collections/extra-${i}`)),
    ];
    render(<SapilChrome>page</SapilChrome>);
    const links = within(screen.getByRole("navigation", { name: "Shop by" })).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      "For her",
      "Find your mood",
      "Gifts",
      "Sarab EDP",
      "Extra 0",
      "Extra 1",
      "Extra 2",
      "Extra 3",
      "Under AED 99",
    ]);
    // from /blog a section link opens the home page at the section
    expect(links[1]).toHaveAttribute("href", "/#mood");
    expect(links[0]).toHaveAttribute("href", "/collections/for-her");
    // the header's collection links are not used when the menu has items
    expect(within(screen.getByRole("navigation", { name: "Shop by" })).queryByRole("link", { name: "Sarab" })).toBeNull();
    // the phone menu's quick links are the same chips
    const phone = screen.getByRole("dialog", { name: "Menu", hidden: true });
    expect(within(phone).getByRole("link", { name: "Find your mood", hidden: true })).toHaveAttribute("href", "/#mood");
    expect(within(phone).getByRole("link", { name: "Under AED 99", hidden: true })).toBeInTheDocument();
  });

  it("falls back to the header's collection links when the Shop-by menu is empty", () => {
    navState.shopByNav = [];
    render(<SapilChrome>page</SapilChrome>);
    const shopBy = screen.getByRole("navigation", { name: "Shop by" });
    expect(within(shopBy).getAllByRole("link").map((l) => l.textContent)).toEqual(["Sarab"]);
  });

  it("shows the top bar with both dropdowns and the announcement; the header has no switchers", () => {
    const { container } = render(<SapilChrome>page</SapilChrome>);
    const bar = container.querySelector("[data-sapil-topbar]") as HTMLElement;
    expect(within(bar).getByRole("link", { name: "New: The Scent Society" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Ship to: Sapil UAE" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Language: English" })).toBeInTheDocument();
    const header = container.querySelector("[data-sapil-header]") as HTMLElement;
    expect(within(header).queryByRole("button", { name: /Ship to|Language/ })).toBeNull();
    expect(header.querySelector("[data-sapil-market-menu]")).toBeNull();
  });

  it("keeps the top bar and its dropdowns when the market has no announcement", () => {
    announce.items = [];
    const { container } = render(<SapilChrome>page</SapilChrome>);
    const bar = container.querySelector("[data-sapil-topbar]") as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.querySelector("[data-sapil-topbar-message]")?.textContent).toBe("");
    expect(within(bar).getByRole("button", { name: "Ship to: Sapil UAE" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Language: English" })).toBeInTheDocument();
    // Phones too: the bar never hides, and with no message it shows the dropdowns.
    expect(bar.className).not.toMatch(/max-760:hidden/);
    const tools = bar.querySelector("[data-sapil-topbar-tools]") as HTMLElement;
    expect(tools.className).not.toMatch(/max-760:hidden/);
  });

  it("on phones a bar with a message shows the message and leaves the dropdowns to the phone menu", () => {
    const { container } = render(<SapilChrome>page</SapilChrome>);
    const bar = container.querySelector("[data-sapil-topbar]") as HTMLElement;
    expect(bar.className).not.toMatch(/max-760:hidden/);
    const tools = bar.querySelector("[data-sapil-topbar-tools]") as HTMLElement;
    expect(tools.className).toMatch(/max-760:hidden/);
  });
});
