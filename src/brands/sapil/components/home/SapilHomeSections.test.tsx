import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_HOME_SECTIONS, FIXTURE_PRODUCTS } from "./fixtures";
import { SapilHomeSections } from "./SapilHomeSections";

const addToCart = vi.hoisted(() => vi.fn());
const settings = vi.hoisted(() => ({
  value: { zoneCode: "SAPIL_URD1", currencyCode: "AED", freeDeliveryThreshold: null as number | null, cashOnDelivery: null, priceEditTiers: [] as number[] },
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/cart", () => ({ useAddToCart: () => ({ addToCart, isPending: false }) }));
vi.mock("@/features/wishlist/hooks/useWishlistToggle", () => ({
  useWishlistToggle: () => ({ supported: true, inWishlist: false, isAuthenticated: false, disabled: false, toggle: vi.fn() }),
}));
vi.mock("@/features/markets/hooks/useMarketSettings", () => ({ useMarketSettings: () => settings.value }));
vi.mock("@/features/catalog/hooks/useCatalogPlp", () => ({
  useCatalogPlp: () => ({
    products: [
      { id: "1", slug: "a", title: "Nancy Pink", price: 15, currency: "AED", imageUrl: "/a.png" },
      { id: "2", slug: "b", title: "Berry Crush", price: 63, currency: "AED", imageUrl: "/b.png" },
    ],
    pagination: { page: 1, limit: 24, total: 2, totalPages: 1 },
    facets: null,
  }),
}));
vi.mock("@/features/merchandising", () => ({
  useFragranceNotes: () => ({ tiles: [{ code: "vanilla", name: "Vanilla", imageUrl: null, sortOrder: 1, fragranceFamily: "vanilla" }], sectionTitle: "", isReady: true }),
  useShopableVideo: () => ({ slides: [], sectionTitle: "", isReady: true }),
}));

beforeEach(() => {
  addToCart.mockReset();
  settings.value = { ...settings.value, priceEditTiers: [], freeDeliveryThreshold: null };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});

describe("SapilHomeSections", () => {
  it("renders the v9 sections from CMS data and skips unknown or empty ones", () => {
    render(<SapilHomeSections sections={FIXTURE_HOME_SECTIONS} />);
    expect(screen.getByText("Scent")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Just landed/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /keep selling out/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Main character" })).toBeInTheDocument();
    expect(screen.getByText("Vanilla")).toBeInTheDocument();
    expect(screen.getByText("The Fruity Four")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /worn every day/ })).toBeInTheDocument();
    // no price edits for the market → no shelf; no films → no reels
    expect(screen.queryByText(/small price/)).toBeNull();
    expect(screen.queryByText(/Watch the/)).toBeNull();
  });

  it("adds a whole bundle with the shared cart hook", () => {
    render(<SapilHomeSections sections={FIXTURE_HOME_SECTIONS} />);
    fireEvent.click(screen.getByRole("button", { name: "Add the The Fruity Four bundle to bag" }));
    expect(addToCart).toHaveBeenCalledTimes(4);
    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ title: FIXTURE_PRODUCTS[0].name, price: 63, currency: "AED" }));
  });

  it("opens another door and shows the market's price edit when it has tiers", () => {
    settings.value = { ...settings.value, priceEditTiers: [50, 99, 199], freeDeliveryThreshold: 100 };
    render(<SapilHomeSections sections={FIXTURE_HOME_SECTIONS} />);
    const doors = screen.getAllByRole("button", { expanded: false });
    fireEvent.click(doors[0]);
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(1);
    expect(screen.getByText(/small price/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Shop the edit/ })).toHaveAttribute("href", "/products?maxPrice=99");
    expect(screen.getByRole("link", { name: "Under AED 50" })).toHaveAttribute("href", "/products?maxPrice=50");
    expect(screen.getByText("ships free")).toBeInTheDocument();
  });
});
