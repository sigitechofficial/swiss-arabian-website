import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/token";
import { storefrontStorageKey } from "@/lib/storefront/brand";
import { useAuthStore } from "@/stores/useAuthStore";

const h = vi.hoisted(() => ({ me: vi.fn(), refresh: vi.fn(), apply: vi.fn() }));
vi.mock("@/features/auth/api/auth.service", () => ({ fetchCustomerMe: h.me }));
vi.mock("@/lib/api/apiClient", () => ({ refreshAccessToken: h.refresh }));
vi.mock("@/features/auth/lib/applyAuthSession", () => ({
  applyCustomerProfile: (profile: { id: string }) => {
    h.apply(profile);
    useAuthStore.getState().setUser(profile as never);
  },
}));

import { AuthSessionProvider } from "./AuthSessionProvider";

function boot() {
  render(
    <AuthSessionProvider>
      <span />
    </AuthSessionProvider>,
  );
}

describe("AuthSessionProvider", () => {
  beforeEach(() => {
    vi.useRealTimers();
    clearTokens();
    h.me.mockReset();
    h.refresh.mockReset();
    h.apply.mockReset();
    useAuthStore.setState({ bootstrapped: false, user: null });
  });

  it("a visitor with no session is a guest at once", async () => {
    boot();
    await waitFor(() => expect(useAuthStore.getState().bootstrapped).toBe(true));
    expect(h.me).not.toHaveBeenCalled();
  });

  it("signs in from the stored session", async () => {
    setTokens("access", "refresh");
    h.me.mockResolvedValue({ id: "c1" });
    boot();
    await waitFor(() => expect(useAuthStore.getState().bootstrapped).toBe(true));
    expect(useAuthStore.getState().user).toMatchObject({ id: "c1" });
  });

  it("drops the session when the server refuses it", async () => {
    setTokens("access", "refresh");
    h.me.mockRejectedValue(new ApiClientError(401, "Your session has expired."));
    boot();
    await waitFor(() => expect(useAuthStore.getState().bootstrapped).toBe(true));
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("drops the session when the refresh token is refused", async () => {
    setTokens("access", "refresh");
    localStorage.removeItem(storefrontStorageKey("sa_store_access_token"));
    h.refresh.mockResolvedValue("rejected");
    boot();
    await waitFor(() => expect(useAuthStore.getState().bootstrapped).toBe(true));
    expect(getRefreshToken()).toBeNull();
    expect(h.me).not.toHaveBeenCalled();
  });

  it("a server blip is retried, and never signs the shopper out", async () => {
    setTokens("access", "refresh");
    h.me
      .mockRejectedValueOnce(new ApiClientError(500, "Internal server error"))
      .mockResolvedValueOnce({ id: "c1" });
    boot();
    await waitFor(() => expect(useAuthStore.getState().bootstrapped).toBe(true), { timeout: 3000 });
    expect(h.me).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().user).toMatchObject({ id: "c1" });
  });

  it("when the server stays unreachable, keeps the session for the next page", async () => {
    setTokens("access", "refresh");
    h.me.mockRejectedValue(new TypeError("Failed to fetch"));
    boot();
    await waitFor(() => expect(useAuthStore.getState().bootstrapped).toBe(true), { timeout: 5000 });
    expect(h.me).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBe("access");
    expect(getRefreshToken()).toBe("refresh");
    expect(useAuthStore.getState().user).toBeNull();
  });
});
