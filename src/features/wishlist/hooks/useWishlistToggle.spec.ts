import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWishlistToggle } from "./useWishlistToggle";

const push = vi.hoisted(() => vi.fn());
const toggle = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ authenticated: false, bootstrapped: true }));
const saved = vi.hoisted(() => new Set<string>());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/useCurrentUser", () => ({
  useIsAuthenticated: () => auth.authenticated,
  useAuthBootstrapped: () => auth.bootstrapped,
}));
vi.mock("./useWishlistMutations", () => ({
  useWishlistMutations: () => ({ toggle, add: { isPending: false }, remove: { isPending: false } }),
}));
vi.mock("./useWishlistStatus", () => ({
  useWishlistStatusMap: () => ({ inWishlist: (id: string) => saved.has(id), isLoading: false }),
}));

const ID = "0b5f6a54-6c3a-4a5c-9b1e-2f7f0d9c8e11";

beforeEach(() => {
  push.mockReset();
  toggle.mockReset();
  saved.clear();
  auth.authenticated = false;
  auth.bootstrapped = true;
});

describe("useWishlistToggle", () => {
  it("is unsupported for products without a catalog id", () => {
    const { result } = renderHook(() => useWishlistToggle("berry-crush"));
    expect(result.current.supported).toBe(false);
    act(() => result.current.toggle());
    expect(toggle).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("sends guests to sign in", () => {
    const { result } = renderHook(() => useWishlistToggle(ID));
    act(() => result.current.toggle());
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/login\?returnTo=/));
    expect(toggle).not.toHaveBeenCalled();
  });

  it("toggles for members with the saved state", () => {
    auth.authenticated = true;
    saved.add(ID);
    const { result } = renderHook(() => useWishlistToggle(ID));
    expect(result.current.inWishlist).toBe(true);
    act(() => result.current.toggle());
    expect(toggle).toHaveBeenCalledWith(ID, true);
  });

  it("waits for auth to load", () => {
    auth.bootstrapped = false;
    const { result } = renderHook(() => useWishlistToggle(ID));
    expect(result.current.disabled).toBe(true);
    act(() => result.current.toggle());
    expect(push).not.toHaveBeenCalled();
  });
});
