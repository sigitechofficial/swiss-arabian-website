import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));
vi.mock("@/lib/i18n/ShopLocaleProvider", () => ({ useShopLocale: () => "ar" }));

import { SiteIntegrationsProvider } from "@/lib/site/SiteIntegrationsProvider";
import { SITE_INTEGRATIONS_OFF, type SiteIntegrations } from "@/lib/site/siteIntegrations.types";
import { CartTabbyPromo } from "./CartTabbyPromo";

/** The address's settings from the backend (ADR-005 phase E): Tabby offered by the market's checkout. */
const tabbyOffered: SiteIntegrations = {
  ...SITE_INTEGRATIONS_OFF,
  marketCode: "URD1",
  paymentPromos: { tabby: { merchantCode: "store_uae", publicKey: "pk_test_x" }, tamara: null },
};

function renderPromo(amount: number, currency: string, settings: SiteIntegrations = tabbyOffered) {
  return render(
    <SiteIntegrationsProvider value={settings}>
      <CartTabbyPromo amount={amount} currency={currency} />
    </SiteIntegrationsProvider>,
  );
}

describe("CartTabbyPromo (Tabby QA: official snippet)", () => {
  it("mounts Tabby's official cart snippet with this market's keys, no home-made plan text", () => {
    const { container } = renderPromo(252, "AED");
    expect(container.querySelector('[data-tabby-promo="cart"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/interest|pay in 4/i);
    expect(
      document.head.querySelector('script[data-tabby-promo="https://checkout.tabby.ai/tabby-promo.js"]'),
    ).not.toBeNull();
  });

  it("uses Tabby's Saudi host for riyal prices", () => {
    renderPromo(252, "SAR");
    expect(
      document.head.querySelector('script[data-tabby-promo="https://checkout.tabby.sa/tabby-promo.js"]'),
    ).not.toBeNull();
  });

  it("is hidden where the market's checkout has no Tabby (e.g. Qatar)", () => {
    const { container } = renderPromo(252, "QAR", { ...tabbyOffered, paymentPromos: { tabby: null, tamara: null } });
    expect(container.innerHTML).toBe("");
  });

  it("is hidden for a currency Tabby doesn't cover, or an empty total", () => {
    expect(renderPromo(252, "USD").container.innerHTML).toBe("");
    expect(renderPromo(0, "AED").container.innerHTML).toBe("");
  });
});
