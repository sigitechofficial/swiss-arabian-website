import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({ tamara: true }));
const tamara = vi.hoisted(() => ({ publicKey: "pk_tamara_test" }));

vi.mock("next/navigation", () => ({ usePathname: () => "/cart" }));
vi.mock("@/lib/config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/env")>();
  return {
    env: {
      ...actual.env,
      flags: { ...actual.env.flags, ...flags },
      tamara,
    },
  };
});

import { CartTamaraPromo } from "./CartTamaraPromo";
import { TAMARA_WIDGET_SRC } from "@/features/checkout/components/TamaraWidget";

describe("CartTamaraPromo", () => {
  beforeEach(() => {
    flags.tamara = true;
    tamara.publicKey = "pk_tamara_test";
    document.head.querySelectorAll("script[data-tamara-widget]").forEach((node) => node.remove());
    delete window.tamaraWidgetConfig;
  });

  it("loads Tamara's widget v2 with the page config for the bag total", async () => {
    const { container } = render(<CartTamaraPromo amount={252} currency="AED" />);

    await waitFor(() => {
      expect(document.head.querySelector(`script[src="${TAMARA_WIDGET_SRC}"]`)).not.toBeNull();
    });
    expect(window.tamaraWidgetConfig).toEqual({ lang: "en", country: "AE", publicKey: "pk_tamara_test" });
    expect(container.querySelector("[data-tamara-host]")).not.toBeNull();
  });

  it("uses Saudi Arabia for a riyal total", async () => {
    render(<CartTamaraPromo amount={100} currency="SAR" />);
    await waitFor(() => expect(window.tamaraWidgetConfig?.country).toBe("SA"));
  });

  it("shows plain pay-in-4 wording when no public key is set", () => {
    tamara.publicKey = "";
    const { container } = render(<CartTamaraPromo amount={252} currency="AED" />);
    expect(container.textContent).toContain("4 interest-free payments of AED 63.00");
    expect(document.head.querySelector("script[data-tamara-widget]")).toBeNull();
  });

  it("is hidden when Tamara is switched off", () => {
    flags.tamara = false;
    const { container } = render(<CartTamaraPromo amount={252} currency="AED" />);
    expect(container.textContent).toBe("");
  });

  it("is hidden for a currency Tamara does not cover", () => {
    const { container } = render(<CartTamaraPromo amount={252} currency="KWD" />);
    expect(container.textContent).toBe("");
  });

  it("is hidden for an empty total", () => {
    const { container } = render(<CartTamaraPromo amount={0} currency="AED" />);
    expect(container.textContent).toBe("");
  });
});
