import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";

const replace = vi.hoisted(() => vi.fn());
vi.mock("@/lib/i18n/useLocaleRouter", () => ({ useLocaleRouter: () => ({ replace }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/account/profile" }));

import { AuthGuard } from "./AuthGuard";

describe("AuthGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    window.history.replaceState(null, "", "/account/profile?tab=x#communication-preferences");
  });

  it("sends a signed-out shopper to sign in, then back to the same page, query and section", async () => {
    useAuthStore.setState({ bootstrapped: true, isAuthenticated: false });
    render(
      <AuthGuard requireAuth>
        <span>account</span>
      </AuthGuard>,
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        `/login?returnTo=${encodeURIComponent("/account/profile?tab=x#communication-preferences")}`,
      ),
    );
  });

  it("a signed-in shopper stays", () => {
    useAuthStore.setState({ bootstrapped: true, isAuthenticated: true });
    render(
      <AuthGuard requireAuth>
        <span>account</span>
      </AuthGuard>,
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
