import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({ tabby: true }));

vi.mock("next/navigation", () => ({ usePathname: () => "/cart" }));
vi.mock("@/lib/config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/env")>();
  return {
    env: {
      ...actual.env,
      flags: { ...actual.env.flags, ...flags },
      tabby: { publicKey: "pk_test_x", merchantCode: "store_uae" },
    },
  };
});

import { CartTabbyPromo } from "./CartTabbyPromo";

describe("CartTabbyPromo", () => {
  beforeEach(() => {
    flags.tabby = true;
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

  it("is hidden for an empty total", () => {
    const { container } = render(<CartTabbyPromo amount={0} currency="AED" />);
    expect(container.textContent).toBe("");
  });
});
