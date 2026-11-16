import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/cart" }));

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

describe("CartTabbyPromo", () => {
  it("splits the bag total in four and opens Tabby's own pop-up", () => {
    renderPromo(252, "AED");

    const button = screen.getByRole("button", { name: /interest-free payments of/i });
    expect(button.textContent).toContain("63");

    fireEvent.click(button);
    const frame = screen.getByTitle("Tabby payment plans") as HTMLIFrameElement;
    const url = new URL(frame.src);
    expect(url.origin).toBe("https://checkout.tabby.ai");
    expect(url.searchParams.get("price")).toBe("252.00");
    expect(url.searchParams.get("currency")).toBe("AED");
    expect(url.searchParams.get("merchant_code")).toBe("store_uae");
    expect(url.searchParams.get("public_key")).toBe("pk_test_x");
    // Offered at checkout: no "coming soon" note.
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  it("works without merchant ids (Tabby's generic terms)", () => {
    renderPromo(100, "AED", {
      ...tabbyOffered,
      paymentPromos: { tabby: { merchantCode: null, publicKey: null }, tamara: null },
    });
    fireEvent.click(screen.getByRole("button", { name: /interest-free payments of/i }));
    const url = new URL((screen.getByTitle("Tabby payment plans") as HTMLIFrameElement).src);
    expect(url.searchParams.has("merchant_code")).toBe(false);
  });

  it("is hidden for a currency Tabby does not cover", () => {
    const { container } = renderPromo(252, "USD");
    expect(container.textContent).toBe("");
  });

  it("is hidden when the market's checkout does not offer Tabby", () => {
    const { container } = renderPromo(252, "AED", SITE_INTEGRATIONS_OFF);
    expect(container.textContent).toBe("");
  });

  it("is hidden outside the settings provider (no default promo)", () => {
    const { container } = render(<CartTabbyPromo amount={252} currency="AED" />);
    expect(container.textContent).toBe("");
  });

  it("is hidden for an empty total", () => {
    const { container } = renderPromo(0, "AED");
    expect(container.textContent).toBe("");
  });
});
