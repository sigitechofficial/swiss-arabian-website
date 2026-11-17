import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
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


describe("useInstalmentPlan", () => {
  it("splits the price into four payments that add up", () => {
    const { result } = renderHook(() => useInstalmentPlan(100.01));
    expect(result.current.payments).toEqual([25, 25, 25, 25.01]);
    expect(result.current.each).toBe(25);
  });

  it("never lists Tabby: Tabby has its official snippet (Tabby QA)", () => {
    const { result } = renderHook(() => useInstalmentPlan(100), { wrapper: TabbyMarket });
    expect(result.current.providers).toEqual([]);
    expect(result.current.available).toBe(false);
  });

  it("offers only the other pay-in-4 providers this market's checkout has (SE-8)", () => {
    function TamaraMarket({ children }: { children: ReactNode }) {
      return (
        <SiteIntegrationsProvider
          value={{ ...SITE_INTEGRATIONS_OFF, paymentPromos: { tabby: null, tamara: { merchantCode: "TAM", publicKey: null } } }}
        >
          {children}
        </SiteIntegrationsProvider>
      );
    }
    const { result } = renderHook(() => useInstalmentPlan(100), { wrapper: TamaraMarket });
    expect(result.current.providers.map((p) => p.id)).toEqual(["tamara"]);
    expect(result.current.available).toBe(true);
    act(() => result.current.openProvider("tamara"));
    expect(result.current.open).toBe("tamara");
    act(() => result.current.close());
    expect(result.current.open).toBeNull();
  });

  it("offers nothing when the market has no pay-in-4 at checkout", () => {
    const { result } = renderHook(() => useInstalmentPlan(100));
    expect(result.current.providers).toEqual([]);
    expect(result.current.available).toBe(false);
  });
});
