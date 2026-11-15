import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useInstalmentPlan } from "./useInstalmentPlan";

vi.mock("next/navigation", () => ({ usePathname: () => "/ar/products/berry-crush" }));

describe("useInstalmentPlan", () => {
  it("splits the price into four payments that add up", () => {
    const { result } = renderHook(() => useInstalmentPlan(100.01, "AED"));
    expect(result.current.payments).toEqual([25, 25, 25, 25.01]);
    expect(result.current.each).toBe(25);
    expect(result.current.providers.map((p) => p.id)).toEqual(["tamara", "tabby"]);
  });

  it("uses Tabby's own pop-up in the page language where Tabby covers the currency", () => {
    const { result } = renderHook(() => useInstalmentPlan(63, "AED"));
    expect(result.current.tabbyUrl).toContain("/installments/ar/");
    act(() => result.current.openProvider("tabby"));
    expect(result.current.openTabbyPopup).toBe(true);
    act(() => result.current.close());
    expect(result.current.open).toBeNull();
    const { result: usd } = renderHook(() => useInstalmentPlan(63, "USD"));
    expect(usd.current.tabbyUrl).toBeNull();
  });
});
