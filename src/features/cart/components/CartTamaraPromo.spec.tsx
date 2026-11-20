import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/cart" }));

import { CartTamaraPromo } from "./CartTamaraPromo";
import { TAMARA_WIDGET_SRC } from "@/features/checkout/components/TamaraWidget";
import { SiteIntegrationsProvider } from "@/lib/site/SiteIntegrationsProvider";
import { SITE_INTEGRATIONS_OFF, type SiteIntegrations } from "@/lib/site/siteIntegrations.types";

/** The address's settings from the backend (ADR-005 phase E): Tamara offered by the market's checkout. */
function tamaraOffered(publicKey: string | null = "pk_tamara_test"): SiteIntegrations {
  return {
    ...SITE_INTEGRATIONS_OFF,
    marketCode: "URD1",
    paymentPromos: { tabby: null, tamara: { merchantCode: null, publicKey } },
  };
}

function renderPromo(amount: number, currency: string, settings: SiteIntegrations = tamaraOffered()) {
  return render(
    <SiteIntegrationsProvider value={settings}>
      <CartTamaraPromo amount={amount} currency={currency} />
    </SiteIntegrationsProvider>,
  );
}

describe("CartTamaraPromo", () => {
  beforeEach(() => {
    document.head.querySelectorAll("script[data-tamara-widget]").forEach((node) => node.remove());
    delete window.tamaraWidgetConfig;
  });

  it("loads Tamara's widget v2 with the page config for the bag total", async () => {
    const { container } = renderPromo(252, "AED");

    await waitFor(() => {
      expect(document.head.querySelector(`script[src="${TAMARA_WIDGET_SRC}"]`)).not.toBeNull();
    });
    expect(window.tamaraWidgetConfig).toEqual({ lang: "en", country: "AE", publicKey: "pk_tamara_test" });
    expect(container.querySelector("[data-tamara-host]")).not.toBeNull();
  });

  it("uses Saudi Arabia for a riyal total", async () => {
    renderPromo(100, "SAR");
    await waitFor(() => expect(window.tamaraWidgetConfig?.country).toBe("SA"));
  });

  it("shows plain pay-in-4 wording when no public key is set", () => {
    const { container } = renderPromo(252, "AED", tamaraOffered(null));
    expect(container.textContent).toContain("4 interest-free payments of AED 63.00");
    expect(document.head.querySelector("script[data-tamara-widget]")).toBeNull();
  });

  it("is hidden when the market's checkout does not offer Tamara", () => {
    const { container } = renderPromo(252, "AED", SITE_INTEGRATIONS_OFF);
    expect(container.textContent).toBe("");
  });

  it("is hidden for a currency Tamara does not cover", () => {
    const { container } = renderPromo(252, "KWD");
    expect(container.textContent).toBe("");
  });

  it("is hidden for an empty total", () => {
    const { container } = renderPromo(0, "AED");
    expect(container.textContent).toBe("");
  });
});
