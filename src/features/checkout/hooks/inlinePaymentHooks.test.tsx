import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/paymobPixel", () => ({
  loadPaymobPixel: () => ({ promise: Promise.reject(new Error("blocked")), cancel: () => undefined }),
}));

import { TabbyCheckoutCard } from "../components/checkout/TabbyCheckoutCard";
import { useInlinePaymobCard } from "./useInlinePaymobCard";
import { useTabbyCheckoutCard } from "./useTabbyCheckoutCard";

afterEach(() => vi.restoreAllMocks());

describe("useInlinePaymobCard", () => {
  it("turns the checkout's sa-inline-pay into Pixel's payFromOutside", () => {
    const seen = vi.fn();
    window.addEventListener("payFromOutside", seen);
    renderHook(() =>
      useInlinePaymobCard({ orderId: "o-1", clientSecret: "cs", publicKey: null, elementId: "x", customStyle: {} }),
    );
    window.dispatchEvent(new CustomEvent("sa-inline-pay", { detail: { orderId: "o-1" } }));
    expect(seen).toHaveBeenCalledTimes(1);
    window.removeEventListener("payFromOutside", seen);
  });

  it("reports a card form that could not load", async () => {
    document.body.innerHTML = '<div id="pm"></div>';
    const { result } = renderHook(() =>
      useInlinePaymobCard({ orderId: "o-1", clientSecret: "cs", publicKey: "pk", elementId: "pm", customStyle: {} }),
    );
    await waitFor(() => expect(result.current.failed).toBe(true));
  });
});

describe("useTabbyCheckoutCard", () => {
  it("falls back to Tabby's standard wording without snippet settings", () => {
    const { result } = renderHook(() => useTabbyCheckoutCard({ config: null, total: 400, currency: "AED", lang: "en" }));
    expect(result.current.fallback).toBe("4 payments of AED 101.50/mo or up to 12 months.");
  });

  it("Swiss Arabian's card still prints that sentence", () => {
    render(<TabbyCheckoutCard config={null} total={400} currency="AED" lang="ar" />);
    expect(screen.getByText("4 دفعات بقيمة 101.50 AED شهريًا أو حتى 12 شهرًا.").tagName).toBe("P");
  });
});
