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
const api = vi.hoisted(() => ({ registerCustomer: vi.fn(), confirmSignup: vi.fn(), resendSignupCode: vi.fn() }));

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
  confirmSignup: api.confirmSignup,
  resendSignupCode: api.resendSignupCode,
}));
vi.mock("../lib/applyAuthSession", () => ({ applyAuthResult: vi.fn() }));
vi.mock("@/lib/auth/sessionCache", () => ({ refreshCustomerScopedCaches: vi.fn() }));

import { useLoginFlow, useRegisterForm, useVerifyForm } from "./useAuthForms";

const feedback = { onNotice: vi.fn(), onError: vi.fn() };

function pending(overrides: Record<string, unknown> = {}) {
  return {
    status: "VERIFICATION_REQUIRED",
    signupId: "s-1",
    email: "a@example.test",
    phoneHint: "67",
    phoneChannel: "SMS",
    emailConfirmed: false,
    phoneConfirmed: false,
    existingAccount: false,
    ...overrides,
  };
}

function withVerification(on: boolean) {
  const value = { ...SITE_INTEGRATIONS_OFF, accountVerification: on };
  return function VerificationSetting({ children }: { children: ReactNode }) {
    return <SiteIntegrationsProvider value={value}>{children}</SiteIntegrationsProvider>;
  };
}

beforeEach(() => {
  nav.push.mockReset();
  nav.params = new URLSearchParams();
  api.registerCustomer.mockReset().mockResolvedValue(pending());
  api.confirmSignup.mockReset();
  api.resendSignupCode.mockReset();
  useUiStore.setState({ catalogContext: { zoneCode: "URD1" } as never, selectedMarketId: "URD1" } as never);
});

async function startSignup(consents = { marketingConsent: true, smsConsent: false }) {
  const { result } = renderHook(() => useRegisterForm(feedback), { wrapper: withVerification(true) });
  act(() => {
    result.current.form.setValue("fullName", "QA Shopper");
    result.current.form.setValue("email", "a@example.test");
    result.current.form.setValue("phone", "+971501234567");
    result.current.form.setValue("password", "Long-enough-1");
    result.current.form.setValue("marketingConsent", consents.marketingConsent);
    result.current.form.setValue("smsConsent", consents.smsConsent);
  });
  await act(async () => {
    await result.current.submit();
  });
  return result;
}

describe("sign-up: a code to the email and to the mobile before any account (identity by proof)", () => {
  it("sends the consents and moves to the two-code step; nothing signs in yet", async () => {
    const result = await startSignup();
    expect(api.registerCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@example.test",
        phone: "+971501234567",
        marketingConsent: true,
        smsConsent: false,
      }),
    );
    expect(result.current.step.kind).toBe("codes");
    expect(feedback.onNotice).toHaveBeenCalledWith("signupCodesSent");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("an email we already hold says 'we found your account'", async () => {
    api.registerCustomer.mockResolvedValue(pending({ existingAccount: true }));
    await startSignup();
    expect(feedback.onNotice).toHaveBeenCalledWith("accountFound");
  });

  it("needs both 6-digit codes; with one confirmed it stays on the code step", async () => {
    const result = await startSignup();
    await act(async () => {
      await result.current.submitCodes();
    });
    expect(api.confirmSignup).not.toHaveBeenCalled();

    api.confirmSignup.mockResolvedValue(pending({ emailConfirmed: true }));
    act(() => {
      result.current.setEmailCode("111111");
      result.current.setPhoneCode("222222");
    });
    await act(async () => {
      await result.current.submitCodes();
    });
    expect(api.confirmSignup).toHaveBeenCalledWith({ signupId: "s-1", emailCode: "111111", phoneCode: "222222" });
    expect(result.current.step.kind).toBe("codes");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("both codes confirmed: signed in and sent on", async () => {
    const result = await startSignup();
    api.confirmSignup.mockResolvedValue({
      status: "AUTHENTICATED",
      token: { accessToken: "t" },
      customer: { id: "c-1" },
      claimedExistingAccount: false,
    });
    act(() => {
      result.current.setEmailCode("111111");
      result.current.setPhoneCode("222222");
    });
    await act(async () => {
      await result.current.submitCodes();
    });
    expect(feedback.onNotice).toHaveBeenCalledWith("signedUp");
    expect(nav.push).toHaveBeenCalled();
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
