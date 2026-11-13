import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";

const state = vi.hoisted(() => ({
  review: null as null | Record<string, unknown>,
  card: null as null | Record<string, unknown>,
  offer: null as null | Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/review/tok",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/reviews/hooks/useReviewRequest", () => ({
  useReviewRequest: () => state.review,
  useReviewRequestCard: () => state.card,
}));
vi.mock("@/features/promotions/hooks/useOfferShop", () => ({
  useOfferShop: () => state.offer,
  moneyNumber: (v: string | null) => (v == null ? null : Number(v)),
}));
vi.mock("@/features/markets/hooks/useMarketTimeZone", () => ({ useMarketTimeZone: () => "Asia/Dubai" }));

import { SapilReviewRequestPage } from "./SapilReviewRequestPage";
import { SapilOfferPage } from "./SapilOfferPage";

async function renderSapil(node: React.ReactNode) {
  const messages = await loadSapilMessages("en");
  return render(<SapilCopyProvider messages={messages}>{node}</SapilCopyProvider>);
}

const reviewBase = {
  products: [],
  isLoading: false,
  errorKind: null,
  refetch: vi.fn(),
  wantsUnsubscribe: false,
  unsubscribed: false,
  unsubscribe: vi.fn(),
  initialRatingFor: () => 0,
};

beforeEach(() => {
  state.card = {
    rating: 0,
    setRating: vi.fn(),
    title: "",
    setTitle: vi.fn(),
    body: "",
    setBody: vi.fn(),
    name: "Ana",
    setName: vi.fn(),
    saving: false,
    posted: null,
    done: null,
    submit: vi.fn(),
  };
});

describe("SapilReviewRequestPage", () => {
  it("shows the order's products with a v9 star picker, in Sapil's wording", async () => {
    state.review = {
      ...reviewBase,
      data: {
        orderNumber: "SP-1",
        firstName: "Ana",
        displayName: "Ana",
        expired: false,
        expiresAt: "2026-12-13T00:00:00Z",
        unsubscribed: false,
        products: [],
      },
      products: [{ productId: "a", name: "Berry Crush", slug: "berry-crush", image: null, review: null }],
    };
    await renderSapil(<SapilReviewRequestPage token="tok" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you, Ana. How did they wear?");
    expect(screen.getByRole("radiogroup", { name: "Your rating for Berry Crush" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Berry Crush" })).toHaveAttribute("href", "/products/berry-crush");
    expect(screen.getByRole("button", { name: "Stop review emails" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Swiss Arabian/i);
  });

  it("draws a dead link as a v9 state panel", async () => {
    state.review = { ...reviewBase, data: undefined, errorKind: "notFound" };
    await renderSapil(<SapilReviewRequestPage token="tok" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This review link isn’t valid.");
  });

  it("shows pastel skeletons while loading", async () => {
    state.review = { ...reviewBase, data: undefined, isLoading: true };
    await renderSapil(<SapilReviewRequestPage token="tok" />);
    expect(screen.getByLabelText("Loading your order…")).toHaveAttribute("aria-busy", "true");
  });
});

describe("SapilOfferPage", () => {
  const product = { productId: "A", variantId: null, sku: "A", slug: "a", title: "Berry Crush", image: null, price: null, amount: "50", inStock: true };
  const group = { id: "g1", name: "For her", requiredQuantity: 1, selectionMode: "replace", products: [product] };
  const offerBase = {
    status: "ready",
    shop: { offer: { badge: "Save 20%", publicTitle: "", shortMessage: "", currencyCode: "AED" }, groups: [group], copy: {} },
    selections: [],
    preview: null,
    productsBySku: new Map(),
    currency: "AED",
    adding: false,
    addFailed: false,
    choose: vi.fn(),
    removeSelection: vi.fn(),
    addSelected: vi.fn(),
    groupFilled: () => false,
    isSelected: () => false,
    unfilled: [group],
    activeId: "g1",
    ready: false,
    subtotal: null,
    savings: null,
    total: null,
  };

  it("draws the bundle builder in the v9 system", async () => {
    state.offer = offerBase;
    await renderSapil(<SapilOfferPage code="TRIO" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Build your bundle.");
    expect(screen.getByRole("heading", { level: 2, name: "For her" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to bundle" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Add bundle to bag" })).toBeDisabled();
    expect(screen.getByText("Add For her to complete your bundle.")).toBeInTheDocument();
    expect(screen.getByText("AED 50")).toBeInTheDocument();
  });

  it("says when the offer does not run in the market", async () => {
    state.offer = { ...offerBase, status: "missing", shop: null };
    await renderSapil(<SapilOfferPage code="TRIO" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This offer isn’t here.");
    expect(screen.getByRole("link", { name: "Shop all fragrances" })).toHaveAttribute("href", "/products");
  });
});
