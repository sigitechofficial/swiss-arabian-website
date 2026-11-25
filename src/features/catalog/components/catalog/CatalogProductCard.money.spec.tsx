import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
// The card's interactive controls need the bag and wishlist stores; only the price is under test.
vi.mock("@/features/home/components/landing/AddToBagButton", () => ({ AddToBagButton: () => null }));
vi.mock("@/features/wishlist/components/WishlistHeartButton", () => ({ WishlistHeartButton: () => null }));
vi.mock("../pdp/StockAlertButton", () => ({ StockAlertButton: () => null }));
vi.mock("../ProductCardTags", () => ({ ProductCardTags: () => null }));

import { PromoLinePrice } from "@/features/promotions/components/PromoLinePrice";
import type { PromotionSnapshotV1 } from "@/features/promotions/types/promotions";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { CatalogProductCard } from "./CatalogProductCard";

function product(price: number, currency: string): CatalogProduct {
  return {
    id: "p1",
    slug: "oud-kuwait",
    title: "Oud Kuwait",
    price,
    currency,
    imageUrl: null,
    tags: [],
    concentration: null,
    collection: "",
    note: "",
    rating: 0,
    sales: 0,
  } as CatalogProduct;
}

describe("prices in a three-decimal currency", () => {
  it("shows a KWD product card price with all three decimals", () => {
    render(<CatalogProductCard product={product(10.12, "KWD")} />);
    expect(screen.getByText("KWD 10.120")).toBeInTheDocument();
  });

  it("keeps two decimals for an AED product card", () => {
    render(<CatalogProductCard product={product(250, "AED")} />);
    expect(screen.getByText("AED 250.00")).toBeInTheDocument();
  });

  it("shows a KWD cart line and its discounted price to the fils", () => {
    const line = { cartItemId: "c1", sku: "OUD", unitPrice: 5.06, quantity: 2, currency: "KWD" };
    const { rerender } = render(<PromoLinePrice snapshot={null} line={line} className="" />);
    expect(screen.getByText("KWD 10.120")).toBeInTheDocument();

    const snapshot = { lineAllocations: [{ ref: "c1", sku: "OUD", amount: "1.005" }] } as PromotionSnapshotV1;
    rerender(<PromoLinePrice snapshot={snapshot} line={line} className="" />);
    expect(screen.getByText("KWD 10.120")).toBeInTheDocument();
    expect(screen.getByText("KWD 9.115")).toBeInTheDocument();
  });
});
