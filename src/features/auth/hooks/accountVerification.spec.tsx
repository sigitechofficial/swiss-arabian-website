import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteIntegrationsProvider } from "@/lib/site/SiteIntegrationsProvider";
import { SITE_INTEGRATIONS_OFF } from "@/lib/site/siteIntegrations.types";
import { useUiStore } from "@/stores/useUiStore";

/**
 * Customer email verification follows the backend (site integrations), never a
 * build flag. Found in browser QA: with the backend asking for a code and the
 * website's own flag off, sign-up skipped verification and the next sign-in
 * landed on a "verification is switched off" page with no way forward.
 */
const nav = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));
const api = vi.hoisted(() => ({ registerCustomer: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/register",
  useSearchParams: () => nav.params,
}));
vi.mock("@/lib/i18n/useShopCopy", () => ({ useShopCopy: () => (key: string) => key }));
vi.mock("@/providers/MarketProvider", () => ({ useMarket: () => ({ marketId: "UAE", catalogContext: { countryCode: "AE" } }) }));
vi.mock("../api/auth.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/auth.service")>()),
  registerCustomer: api.registerCustomer,
}));

import { useLoginFlow, useRegisterForm, useVerifyForm } from "./useAuthForms";

const feedback = { onNotice: vi.fn(), onError: vi.fn() };

function withVerification(on: boolean) {
  const value = { ...SITE_INTEGRATIONS_OFF, accountVerification: on };
  return function VerificationSetting({ children }: { children: ReactNode }) {
    return <SiteIntegrationsProvider value={value}>{children}</SiteIntegrationsProvider>;
  };
}

beforeEach(() => {
  nav.push.mockReset();
  nav.params = new URLSearchParams();
  api.registerCustomer.mockReset().mockResolvedValue({ status: "EMAIL_VERIFICATION_REQUIRED", email: "a@example.test" });
  useUiStore.setState({ catalogContext: { zoneCode: "URD1" } as never, selectedMarketId: "URD1" } as never);
});

describe("customer email verification (backend setting)", () => {
  it("asks for verification at sign-up only when the backend has it on", async () => {
    for (const on of [true, false]) {
      api.registerCustomer.mockClear();
      const { result } = renderHook(() => useRegisterForm(feedback), { wrapper: withVerification(on) });
      act(() => {
        result.current.form.setValue("fullName", "QA Shopper");
        result.current.form.setValue("email", "a@example.test");
        result.current.form.setValue("phone", "+971501234567");
        result.current.form.setValue("password", "Long-enough-1");
      });
      await act(async () => {
        await result.current.submit();
      });
      expect(api.registerCustomer).toHaveBeenCalledWith(expect.objectContaining({ verifyEmailFirst: on }));
    }
  });

  it("offers code sign-in from the backend setting", () => {
    expect(renderHook(() => useLoginFlow(feedback), { wrapper: withVerification(true) }).result.current.codeSignInEnabled).toBe(true);
    expect(renderHook(() => useLoginFlow(feedback), { wrapper: withVerification(false) }).result.current.codeSignInEnabled).toBe(false);
  });

  it("opens the code screen whenever the backend has just asked for a code, even if the setting did not load", () => {
    nav.params = new URLSearchParams({ email: "a@example.test", returnTo: "/checkout" });
    expect(renderHook(() => useVerifyForm(feedback), { wrapper: withVerification(false) }).result.current.enabled).toBe(true);
    nav.params = new URLSearchParams();
    expect(renderHook(() => useVerifyForm(feedback), { wrapper: withVerification(false) }).result.current.enabled).toBe(false);
    expect(renderHook(() => useVerifyForm(feedback), { wrapper: withVerification(true) }).result.current.enabled).toBe(true);
  });
});
