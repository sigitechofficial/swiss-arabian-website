import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readResetIdentifier, storeResetIdentifier } from "../utils/resetIdentifier";
import { useForgotPasswordForm, useResetPasswordForm } from "./useAuthForms";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), pathname: "/forgot-password" }));
const api = vi.hoisted(() => ({ forgotPassword: vi.fn(), resetPassword: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace, prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/i18n/useShopCopy", () => ({ useShopCopy: () => (key: string) => key }));
vi.mock("@/providers/MarketProvider", () => ({ useMarket: () => ({ marketId: null }) }));
vi.mock("../api/auth.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/auth.service")>()),
  forgotPassword: api.forgotPassword,
  resetPassword: api.resetPassword,
}));

const feedback = { onNotice: vi.fn(), onError: vi.fn() };

beforeEach(() => {
  sessionStorage.clear();
  nav.push.mockReset();
  api.forgotPassword.mockReset().mockResolvedValue(undefined);
  api.resetPassword.mockReset().mockResolvedValue(undefined);
});

describe("forgot password → reset password", () => {
  it("keeps the email out of the reset address and carries it in session storage", async () => {
    window.history.replaceState(null, "", "/forgot-password");
    const { result } = renderHook(() => useForgotPasswordForm(feedback));
    act(() => result.current.form.setValue("identifier", "shopper@example.com"));
    await act(async () => {
      await result.current.submit();
    });
    expect(nav.push).toHaveBeenCalledWith("/reset-password");
    expect(String(nav.push.mock.calls[0]?.[0])).not.toContain("example.com");
    expect(readResetIdentifier()).toBe("shopper@example.com");
  });

  it("keeps the Arabic address on the way to the reset page", async () => {
    window.history.replaceState(null, "", "/ar/forgot-password");
    const { result } = renderHook(() => useForgotPasswordForm(feedback));
    act(() => result.current.form.setValue("identifier", "shopper@example.com"));
    await act(async () => {
      await result.current.submit();
    });
    expect(nav.push).toHaveBeenCalledWith("/ar/reset-password");
  });

  it("fills the reset form from session storage and forgets it once the password is set", async () => {
    window.history.replaceState(null, "", "/reset-password");
    storeResetIdentifier("shopper@example.com");
    const { result } = renderHook(() => useResetPasswordForm(feedback));
    await waitFor(() => expect(result.current.form.getValues("identifier")).toBe("shopper@example.com"));
    act(() => {
      result.current.setCode("123456");
      result.current.form.setValue("newPassword", "N3w-password!");
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(api.resetPassword).toHaveBeenCalled();
    expect(readResetIdentifier()).toBeNull();
    expect(nav.push).toHaveBeenCalledWith("/login");
  });

  it("starts empty without a stored identifier (e.g. a new tab)", async () => {
    window.history.replaceState(null, "", "/reset-password");
    const { result } = renderHook(() => useResetPasswordForm(feedback));
    await Promise.resolve();
    expect(result.current.form.getValues("identifier")).toBe("");
  });
});
