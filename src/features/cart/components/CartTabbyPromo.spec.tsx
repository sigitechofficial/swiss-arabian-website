import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/cart" }));

import { CartTabbyPromo } from "./CartTabbyPromo";

// Per-brand switches and keys come from getBrand() (src/lib/brand), read from env.
describe("CartTabbyPromo", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TABBY", "true");
    vi.stubEnv("NEXT_PUBLIC_TABBY_PUBLIC_KEY", "pk_test_x");
    vi.stubEnv("NEXT_PUBLIC_TABBY_MERCHANT_CODE", "store_uae");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("splits the bag total in four and opens Tabby's own pop-up", () => {
    render(<CartTabbyPromo amount={252} currency="AED" />);

    const button = screen.getByRole("button", { name: /interest-free payments of/i });
    expect(button.textContent).toContain("63");

    fireEvent.click(button);
    const frame = screen.getByTitle("Tabby payment plans") as HTMLIFrameElement;
    const url = new URL(frame.src);
    expect(url.origin).toBe("https://checkout.tabby.ai");
    expect(url.searchParams.get("price")).toBe("252.00");
    expect(url.searchParams.get("currency")).toBe("AED");
    expect(url.searchParams.get("merchant_code")).toBe("store_uae");
  });

  it("is hidden for a currency Tabby does not cover", () => {
    const { container } = render(<CartTabbyPromo amount={252} currency="USD" />);
    expect(container.textContent).toBe("");
  });

  it("is hidden when Tabby is off for the brand", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TABBY", "false");
    const { container } = render(<CartTabbyPromo amount={252} currency="AED" />);
    expect(container.textContent).toBe("");
  });

  it("is hidden for an empty total", () => {
    const { container } = render(<CartTabbyPromo amount={0} currency="AED" />);
    expect(container.textContent).toBe("");
  });
});
