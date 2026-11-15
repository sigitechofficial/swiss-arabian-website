import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let pathname = "/";
let trackingEnabled = true;
let insiderEnabled = true;

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/config/env", () => ({
  env: {
    get tracking() {
      return { enabled: trackingEnabled };
    },
    onsite: { enabled: false },
  },
}));
// What the address loads comes from the switchboard (ADR-005 phase E): no Google tags here,
// Insider's tag on or off per test.
vi.mock("@/lib/site/SiteIntegrationsProvider", () => ({
  useSiteIntegrations: () => ({
    analytics: null,
    insiderTag: insiderEnabled ? { accountId: "acc", scriptHost: "x" } : null,
  }),
}));

import { ConsentBanner } from "./ConsentBanner";
import { CookieSettingsLink } from "./CookieSettingsLink";
import { getTrackingConsent } from "@/lib/analytics/tracker";
import { getConsent, resetConsentCacheForTests, setConsent } from "@/lib/consent/consent";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import { loadMessages } from "@/lib/i18n/messages";

describe("ConsentBanner", () => {
  beforeEach(() => {
    pathname = "/";
    trackingEnabled = true;
    insiderEnabled = true;
    window.localStorage.clear();
    resetConsentCacheForTests();
  });

  it("asks when something optional is on and nobody has chosen", () => {
    render(<ConsentBanner />);
    expect(screen.getByRole("region", { name: "Your privacy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept all" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject all" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manage choices" })).toBeTruthy();
  });

  it("sits above the on-site banner and popup", () => {
    render(<ConsentBanner />);
    expect(screen.getByRole("region").className).toContain("z-[230]");
  });

  it("Accept all allows every category in use and goes away", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Accept all" }));
    expect(getConsent()).toEqual({ analytics: true, marketing: true });
    expect(getTrackingConsent()).toBe("GRANTED");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("Reject all refuses everything and goes away", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Reject all" }));
    expect(getConsent()).toEqual({ analytics: false, marketing: false });
    expect(getTrackingConsent()).toBe("DENIED");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("Manage choices saves one category on and one off", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Manage choices" }));
    expect(screen.getByText("Always on")).toBeTruthy();
    const analytics = screen.getByRole("switch", { name: "Analytics" });
    const marketing = screen.getByRole("switch", { name: "Marketing" });
    expect((analytics as HTMLInputElement).checked).toBe(false);
    expect((marketing as HTMLInputElement).checked).toBe(false);
    await user.click(analytics);
    await user.click(screen.getByRole("button", { name: "Save choices" }));
    expect(getConsent()).toEqual({ analytics: true, marketing: false });
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("only offers the categories this site uses", async () => {
    insiderEnabled = false;
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Manage choices" }));
    expect(screen.getByRole("switch", { name: "Analytics" })).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "Marketing" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Accept all" }));
    expect(getConsent()).toEqual({ analytics: true, marketing: false });
  });

  it("does not show once a choice exists", () => {
    setConsent({ analytics: false, marketing: false });
    render(<ConsentBanner />);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("asks again when only the old measurement-only answer exists", () => {
    window.localStorage.setItem("sa_tracking_consent", "granted");
    render(<ConsentBanner />);
    expect(screen.getByRole("region")).toBeTruthy();
  });

  it("does not show when nothing optional is switched on", () => {
    trackingEnabled = false;
    insiderEnabled = false;
    render(<ConsentBanner />);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("the footer's Cookie settings reopens the choices with the saved answer", async () => {
    setConsent({ analytics: true, marketing: false });
    const user = userEvent.setup();
    render(
      <>
        <ConsentBanner />
        <CookieSettingsLink />
      </>,
    );
    expect(screen.queryByRole("region")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect((screen.getByRole("switch", { name: "Analytics" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("switch", { name: "Marketing" }) as HTMLInputElement).checked).toBe(false);
  });

  it("reloads the page when a category that ran is turned off", async () => {
    setConsent({ analytics: true, marketing: true });
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { value: { ...original, reload }, configurable: true });
    const user = userEvent.setup();
    render(
      <>
        <ConsentBanner />
        <CookieSettingsLink />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Reject all" }));
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("sa_visitor_id")).toBeNull();
    Object.defineProperty(window, "location", { value: original, configurable: true });
  });

  // The [locale] layout renders the banner inside the page's language provider.
  it("speaks Arabic on Arabic pages and links to the brand's privacy policy in that language", async () => {
    pathname = "/ar/products";
    render(
      <ShopLocaleProvider locale="ar" messages={await loadMessages("ar")}>
        <ConsentBanner />
      </ShopLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "قبول الكل" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "رفض الكل" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "إدارة الخيارات" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "سياسة الخصوصية" }).getAttribute("href")).toBe("/ar/pages/privacy-policy");
  });
});
