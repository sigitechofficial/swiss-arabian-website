import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => ({
  value: null as null | Record<string, unknown>,
}));

vi.mock("@/features/payments/tabby/tabbyPromo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/payments/tabby/tabbyPromo")>();
  return { ...actual, useTabbyPromoConfig: () => config.value };
});
vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));

import { CartTabbyPromo } from "./CartTabbyPromo";

const uae = {
  available: true,
  publicKey: "pk_test_x",
  merchantCode: "swissarabian_web_uae",
  currency: "AED",
  snippetScriptBase: "https://checkout.tabby.ai",
};

describe("CartTabbyPromo", () => {
  beforeEach(() => {
    config.value = uae;
  });

  it("mounts Tabby's official cart snippet, no home-made plan text", () => {
    const { container } = render(<CartTabbyPromo amount={252} currency="AED" />);
    const slot = container.querySelector('[data-tabby-promo="cart"]');
    expect(slot).not.toBeNull();
    expect(container.textContent).not.toMatch(/interest|pay in 4/i);
    expect(document.head.querySelector('script[data-tabby-promo="https://checkout.tabby.ai/tabby-promo.js"]')).not.toBeNull();
  });

  it("is hidden in a market without Tabby (Qatar)", () => {
    config.value = { available: false };
    const { container } = render(<CartTabbyPromo amount={252} currency="QAR" />);
    expect(container.innerHTML).toBe("");
  });

  it("is hidden for an empty total", () => {
    const { container } = render(<CartTabbyPromo amount={0} currency="AED" />);
    expect(container.innerHTML).toBe("");
  });
});
