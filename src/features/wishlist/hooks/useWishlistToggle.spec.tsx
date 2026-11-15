import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWishlistToggle } from "./useWishlistToggle";

const push = vi.hoisted(() => vi.fn());
const toggle = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ signedIn: false }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/useCurrentUser", () => ({
  useIsAuthenticated: () => auth.signedIn,
  useAuthBootstrapped: () => true,
}));
vi.mock("../api/wishlist.service", () => ({
  fetchWishlistStatus: vi.fn(async () => ({ items: [] })),
}));
vi.mock("./useWishlistMutations", () => ({
  useWishlistMutations: () => ({ toggle, add: { isPending: false }, remove: { isPending: false } }),
}));

const ID = "0b6b2c1e-8a4f-4d2e-9c1a-1f2e3d4c5b6a";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  push.mockReset();
  toggle.mockReset();
});

describe("useWishlistToggle", () => {
  it("is unavailable for non-catalog ids", () => {
    const { result } = renderHook(() => useWishlistToggle("static-slug"), { wrapper });
    expect(result.current.available).toBe(false);
    act(() => result.current.toggle());
    expect(toggle).not.toHaveBeenCalled();
  });

  it("sends guests to sign in and back", () => {
    auth.signedIn = false;
    const { result } = renderHook(() => useWishlistToggle(ID), { wrapper });
    act(() => result.current.toggle());
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/login\?returnTo=/));
    expect(toggle).not.toHaveBeenCalled();
  });

  it("toggles the product for signed-in shoppers", () => {
    auth.signedIn = true;
    const { result } = renderHook(() => useWishlistToggle(ID), { wrapper });
    act(() => result.current.toggle());
    expect(toggle).toHaveBeenCalledWith(ID, false);
  });
});
