import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { freeDeliveryProgress } from "@/features/markets/hooks/useMarketDelivery";
import { formatAED } from "../../ui/shared";
import { toFreeDelivery } from "./bagData";
import { SapilBagDrawerView } from "./SapilBagDrawerView";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const money = (amount: number | null | undefined, currency: string) => formatAED(amount ?? 0, currency);

describe("free delivery", () => {
  it("measures the bag against the market threshold", () => {
    expect(freeDeliveryProgress(100, 63)).toEqual({ threshold: 100, progress: 0.63, remaining: 37, reached: false });
    expect(freeDeliveryProgress(100, 120)?.reached).toBe(true);
    expect(freeDeliveryProgress(null, 63)).toBeNull();
  });

  it("maps progress to the v9 card states", () => {
    const base = { threshold: 100, unlocked: false, progress: 0.63, remaining: 37, currency: "AED", money };
    expect(toFreeDelivery({ ...base, empty: true })).toEqual({ state: "start", threshold: "AED 100" });
    expect(toFreeDelivery({ ...base, empty: false })).toEqual({ state: "progress", remaining: "AED 37", threshold: "AED 100", percent: 63 });
    expect(toFreeDelivery({ ...base, empty: false, unlocked: true })).toEqual({ state: "unlocked" });
    expect(toFreeDelivery({ ...base, threshold: null, empty: false })).toBeNull();
  });
});

describe("SapilBagDrawerView", () => {
  const props = {
    open: true,
    onClose: vi.fn(),
    freeDelivery: { state: "progress" as const, remaining: "AED 37", threshold: "AED 100", percent: 63 },
    onQuantityChange: vi.fn(),
    onRemove: vi.fn(),
    subtotal: "AED 63",
    delivery: "At checkout",
    total: "AED 63",
    checkoutHref: "/checkout",
    shopHref: "/products",
  };

  it("shows the empty bag with a way to the shop", () => {
    render(<SapilBagDrawerView {...props} count={0} lines={[]} freeDelivery={{ state: "start", threshold: "AED 100" }} />);
    expect(screen.getByRole("dialog", { name: "Your bag" })).toBeTruthy();
    expect(screen.getByText("Your bag is empty.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Shop all perfume" }).getAttribute("href")).toBe("/products");
    expect(screen.queryByRole("link", { name: "Checkout" })).toBeNull();
  });

  it("lists lines with quantity, remove, totals and free-delivery progress", () => {
    render(
      <SapilBagDrawerView
        {...props}
        count={2}
        lines={[{ key: "l1", name: "Berry Crush", href: "/products/berry-crush", detail: "AED 63", quantity: 2, total: "AED 126", tags: [{ text: "20% off", strong: true }] }]}
      />,
    );
    expect(screen.getByText("Add AED 37 for free delivery")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("63");
    expect(screen.getByText("20% off")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Increase Berry Crush" }));
    expect(props.onQuantityChange).toHaveBeenCalledWith("l1", 3);
    fireEvent.click(screen.getByRole("button", { name: "Remove Berry Crush" }));
    expect(props.onRemove).toHaveBeenCalledWith("l1");
    expect(screen.getByRole("link", { name: "Checkout" }).getAttribute("href")).toBe("/checkout");
  });

  it("holds checkout while the bag is syncing", () => {
    render(<SapilBagDrawerView {...props} count={1} syncing checkoutBlocked lines={[{ key: "l1", name: "A", href: "#", detail: "", quantity: 1, total: "AED 1" }]} />);
    const link = screen.getByRole("link", { name: "Updating bag…" });
    expect(link.getAttribute("aria-disabled")).toBe("true");
  });
});
