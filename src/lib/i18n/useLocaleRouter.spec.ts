import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocaleRouter } from "./useLocaleRouter";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), pathname: "/" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace, prefetch: nav.prefetch, back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => nav.pathname,
}));

beforeEach(() => {
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.prefetch.mockReset();
});

describe("useLocaleRouter", () => {
  it("keeps Arabic through checkout, sign-in, tracking and the confirmation", () => {
    window.history.replaceState(null, "", "/ar/cart");
    const { result } = renderHook(() => useLocaleRouter());
    result.current.push("/checkout");
    result.current.push("/login?returnTo=%2Far%2Faccount");
    result.current.replace("/order-confirmation/abc");
    result.current.push("/track/SA-1");
    result.current.prefetch("/register");
    expect(nav.push.mock.calls.map((c) => c[0])).toEqual([
      "/ar/checkout",
      "/ar/login?returnTo=%2Far%2Faccount",
      "/ar/track/SA-1",
    ]);
    expect(nav.replace).toHaveBeenCalledWith("/ar/order-confirmation/abc");
    expect(nav.prefetch).toHaveBeenCalledWith("/ar/register");
  });

  it("leaves English (default-language) addresses and prefixed ones unchanged", () => {
    window.history.replaceState(null, "", "/cart");
    const { result } = renderHook(() => useLocaleRouter());
    result.current.push("/checkout");
    result.current.push("/ar/account");
    result.current.push("https://pay.example.com/x");
    expect(nav.push.mock.calls.map((c) => c[0])).toEqual(["/checkout", "/ar/account", "https://pay.example.com/x"]);
  });
});
