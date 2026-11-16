import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SiteIntegrationsProvider } from "@/lib/site/SiteIntegrationsProvider";
import { SITE_INTEGRATIONS_OFF } from "@/lib/site/siteIntegrations.types";
import { useInstalmentPlan } from "./useInstalmentPlan";

/** A market whose checkout offers Tabby (not Tamara). */
function TabbyMarket({ children }: { children: ReactNode }) {
  return (
    <SiteIntegrationsProvider
      value={{
        ...SITE_INTEGRATIONS_OFF,
        paymentPromos: { tabby: { merchantCode: "SAUAE", publicKey: "pk_test_abc" }, tamara: null },
      }}
    >
      {children}
    </SiteIntegrationsProvider>
  );
}

vi.mock("next/navigation", () => ({ usePathname: () => "/ar/products/berry-crush" }));

describe("useInstalmentPlan", () => {
  it("splits the price into four payments that add up", () => {
    const { result } = renderHook(() => useInstalmentPlan(100.01, "AED"));
    expect(result.current.payments).toEqual([25, 25, 25, 25.01]);
    expect(result.current.each).toBe(25);
  });

  it("offers only the pay-in-4 providers this market's checkout has (SE-8)", () => {
    const { result } = renderHook(() => useInstalmentPlan(100, "AED"), { wrapper: TabbyMarket });
    expect(result.current.providers.map((p) => p.id)).toEqual(["tabby"]);
    expect(result.current.available).toBe(true);
  });

  it("offers nothing when the market has no pay-in-4 at checkout", () => {
    const { result } = renderHook(() => useInstalmentPlan(100, "AED"));
    expect(result.current.providers).toEqual([]);
    expect(result.current.available).toBe(false);
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
