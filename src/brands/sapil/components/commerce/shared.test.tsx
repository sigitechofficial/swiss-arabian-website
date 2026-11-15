import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ path: "/cart" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));

import { useSapilMoneyParts } from "./shared";

describe("useSapilMoneyParts", () => {
  it("keeps v9's AED code in English", () => {
    state.path = "/cart";
    const { result } = renderHook(() => useSapilMoneyParts());
    expect(result.current(79, "AED")).toEqual({ currency: "AED", amount: "79" });
  });

  it("uses the language's own currency sign in Arabic (no English code on /ar pages)", () => {
    state.path = "/ar/cart";
    const { result } = renderHook(() => useSapilMoneyParts());
    const parts = result.current(79, "AED");
    expect(parts.currency).toBe("د.إ.");
    expect(parts.amount).not.toMatch(/[A-Za-z]/);
  });
});
