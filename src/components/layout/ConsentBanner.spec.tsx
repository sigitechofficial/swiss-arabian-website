import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let pathname = "/";
let trackingEnabled = true;

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/config/env", () => ({
  env: {
    get tracking() {
      return { enabled: trackingEnabled };
    },
  },
}));

import { ConsentBanner } from "./ConsentBanner";
import { getTrackingConsent } from "@/lib/analytics/tracker";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import { loadMessages } from "@/lib/i18n/messages";

describe("ConsentBanner", () => {
  beforeEach(() => {
    pathname = "/";
    trackingEnabled = true;
    window.localStorage.clear();
  });

  it("asks when tracking is on and nobody has chosen", () => {
    render(<ConsentBanner />);
    expect(screen.getByRole("region", { name: "Your privacy" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Decline" })).toBeTruthy();
  });

  it("sits above the on-site banner and popup", () => {
    render(<ConsentBanner />);
    expect(screen.getByRole("region").className).toContain("z-[230]");
  });

  it("remembers Accept and goes away", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(getTrackingConsent()).toBe("GRANTED");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("remembers Decline and goes away", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);
    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(getTrackingConsent()).toBe("DENIED");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("does not show once a choice exists", () => {
    window.localStorage.setItem("sa_tracking_consent", "denied");
    render(<ConsentBanner />);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("does not show when tracking is switched off", () => {
    trackingEnabled = false;
    render(<ConsentBanner />);
    expect(screen.queryByRole("region")).toBeNull();
  });

  // The [locale] layout renders the banner inside the page's language provider.
  it("speaks Arabic on Arabic pages and links to the brand's privacy policy in that language", async () => {
    pathname = "/ar/products";
    render(
      <ShopLocaleProvider locale="ar" messages={await loadMessages("ar")}>
        <ConsentBanner />
      </ShopLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "موافق" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "رفض" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "سياسة الخصوصية" }).getAttribute("href")).toBe("/ar/pages/privacy-policy");
  });
});
