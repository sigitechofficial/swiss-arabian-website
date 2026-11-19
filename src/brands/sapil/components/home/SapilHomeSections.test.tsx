import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsSection } from "@/features/cms/types/cmsHome.types";
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
const films = vi.hoisted(() => ({ value: [] as unknown[] }));
vi.mock("@/features/merchandising", () => ({
  useFragranceNotes: () => ({ tiles: [{ code: "vanilla", name: "Vanilla", imageUrl: null, sortOrder: 1, fragranceFamily: "vanilla" }], sectionTitle: "", isReady: true }),
  useShopableVideo: () => ({ slides: films.value, sectionTitle: "", isReady: true }),
}));

const FILM = {
  productId: "p1",
  variantId: null,
  sku: null,
  slug: "berry-crush",
  name: "Berry Crush",
  image: "/a.png",
  video: { url: "/a.mp4", name: null },
  priceSummary: null,
  isSellable: true,
  isVisible: true,
  sortOrder: 1,
};

/** The fixture homepage with `data` merged into the sections with these ids. */
function withData(patch: Record<string, Record<string, unknown>>): CmsSection[] {
  return FIXTURE_HOME_SECTIONS.map((s) => (patch[s.id] ? { ...s, data: { ...(s.data as Record<string, unknown>), ...patch[s.id] } } : s));
}

/** React `useId` values depend on what rendered before; the snapshot leaves them out. */
const noIds = (html = "") => html.replace(/_r_\w+_/g, "_r_");

/** Each section's head markup (eyebrow, heading, line under it), for the no-CMS-copy snapshot. */
function heads(container: HTMLElement) {
  return Array.from(container.querySelectorAll("section")).map((sec) => {
    // Section titles are <p role="heading" aria-level="2"> (SEO audit p5: no h2/h3 on the home page).
    const h = sec.querySelector('[role="heading"], h2');
    return `${sec.id || sec.getAttribute("aria-label")}: ${noIds((h?.parentElement?.parentElement ?? sec).outerHTML)}`;
  });
}

beforeEach(() => {
  addToCart.mockReset();
  settings.value = { ...settings.value, priceEditTiers: [], freeDeliveryThreshold: null };
  films.value = [];
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
    expect(screen.getByRole("link", { name: /Shop the edit/ })).toHaveAttribute("href", "/products?under=99");
    expect(screen.getByRole("link", { name: "Under AED 50" })).toHaveAttribute("href", "/products?under=50");
    expect(screen.getByText("ships free")).toBeInTheDocument();
  });

  it("with no CMS heading copy renders today's built-in heads, unchanged", () => {
    settings.value = { ...settings.value, priceEditTiers: [50, 99, 199], freeDeliveryThreshold: 100 };
    films.value = [FILM];
    const { container, unmount } = render(<SapilHomeSections sections={FIXTURE_HOME_SECTIONS} />);
    expect(heads(container)).toMatchSnapshot();
    unmount();
    const hero = render(<SapilHomeSections sections={[{ id: "v", type: "SHOPABLE_VIDEO_SHOWCASE", position: 0, data: {} }]} />);
    expect(noIds(hero.container.querySelector("section > div > div > div")?.outerHTML)).toMatchSnapshot();
  });

  it("draws a rail's CMS title with its emphasis in the serif, and its subtitle", () => {
    render(
      <SapilHomeSections
        sections={withData({
          new: { heading: "Fresh", title: "Fresh in, still fizzing.", titleEmphasis: "still fizzing.", subtitle: "Five new bottles this week." },
          best: { title: "Loved by everyone" },
        })}
      />,
    );
    const h = screen.getByRole("heading", { name: "Fresh in, still fizzing." });
    expect(screen.getByText("still fizzing.")).toHaveClass("font-sapil-serif", "italic");
    expect(h).toContainElement(screen.getByText("still fizzing."));
    expect(screen.getByText("Five new bottles this week.")).toBeInTheDocument();
    expect(screen.getByText("Fresh")).toBeInTheDocument();
    expect(screen.queryByText(/Just landed/)).toBeNull();
    // a title without emphasis is all plain; no subtitle → none (as today)
    const best = screen.getByRole("heading", { name: "Loved by everyone" });
    expect(best.querySelector(".font-sapil-serif")).toBeNull();
    expect(screen.queryByText(/keep selling out/)).toBeNull();
  });

  it("keeps today's copy when the CMS title is empty", () => {
    render(<SapilHomeSections sections={withData({ new: { title: "  ", titleEmphasis: "x", subtitle: "" } })} />);
    const h = screen.getByRole("heading", { name: "Just landed, still fizzing." });
    expect(h.innerHTML).toBe('Just landed, <span class="font-sapil-serif italic font-[400]">still fizzing.</span>');
  });

  it("takes the collections, notes and bundles row heads from the CMS", () => {
    render(
      <SapilHomeSections
        sections={withData({
          collections: { title: "Our worlds of scent", titleEmphasis: "worlds", subtitle: "Six moods, one shelf." },
          notes: { heading: "By note", title: "Find your note", titleEmphasis: "note", subtitle: "Tap one to shop it." },
          b1: { description: "Bundle line", rowEyebrow: "Sets", rowTitle: "Two is better", rowTitleEmphasis: "better", rowSubtitle: "Saved in your bag." },
          b2: { rowTitle: "Ignored, not the first bundle" },
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Our worlds of scent" })).toBeInTheDocument();
    expect(screen.getByText("worlds")).toHaveClass("font-sapil-serif");
    expect(screen.getByText("Six moods, one shelf.")).toBeInTheDocument();
    expect(screen.getByText("By note")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find your note" })).toBeInTheDocument();
    expect(screen.getByText("Tap one to shop it.")).toBeInTheDocument();
    expect(screen.queryByText(/Start with a note/)).toBeNull();
    expect(screen.getByText("Sets")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two is better" })).toBeInTheDocument();
    expect(screen.getByText("better")).toHaveClass("font-sapil-serif");
    expect(screen.getByText("Saved in your bag.")).toBeInTheDocument();
    expect(screen.queryByText("Bundle line")).toBeNull();
    expect(screen.queryByText(/Ignored/)).toBeNull();
  });

  it("falls back to the first bundle's description for the bundles row line", () => {
    render(<SapilHomeSections sections={withData({ b1: { description: "Bundle line" } })} />);
    expect(screen.getByText("Bundle line")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Better together, and easier." })).toBeInTheDocument();
  });

  it("takes the price shelf's eyebrow and title from the first new-arrivals rail", () => {
    settings.value = { ...settings.value, priceEditTiers: [50, 99, 199], freeDeliveryThreshold: 100 };
    render(
      <SapilHomeSections
        sections={withData({ new: { priceEditEyebrow: "Small treats", priceEditTitle: "Under a hundred, all of them", priceEditTitleEmphasis: "all of them" } })}
      />,
    );
    expect(screen.getByText("Small treats")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Under a hundred, all of them" })).toBeInTheDocument();
    expect(screen.getByText("all of them")).toHaveClass("font-sapil-serif");
    expect(screen.queryByText(/small price/)).toBeNull();
    expect(screen.queryByText(/Shop under/)).toBeNull();
  });

  it("takes the reels head and the video hero copy from the CMS", () => {
    films.value = [FILM];
    const reels = render(
      <SapilHomeSections sections={withData({ reels: { heading: "On Instagram", title: "See it worn", titleEmphasis: "worn", subtitle: "Real people, real bottles." } })} />,
    );
    expect(screen.getByText("On Instagram")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "See it worn" })).toBeInTheDocument();
    expect(screen.getByText("worn")).toHaveClass("font-sapil-serif");
    expect(screen.getByText("Real people, real bottles.")).toBeInTheDocument();
    expect(screen.queryByText(/Watch the/)).toBeNull();
    reels.unmount();

    render(
      <SapilHomeSections
        sections={[
          { id: "v", type: "SHOPABLE_VIDEO_SHOWCASE", position: 0, data: { heading: "Showing now", title: "Made for every day", titleEmphasis: "every day", subtitle: "Films first." } },
        ]}
      />,
    );
    expect(screen.getByText("Showing now")).toBeInTheDocument();
    expect(screen.getByText("every day")).toHaveClass("font-sapil-serif");
    expect(screen.getByText("Films first.")).toBeInTheDocument();
    expect(screen.queryByText("Now playing")).toBeNull();
    expect(screen.queryByText(/worn every day/)).toBeNull();
  });
});
