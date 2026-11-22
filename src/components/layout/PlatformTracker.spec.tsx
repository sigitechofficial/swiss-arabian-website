import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const state = vi.hoisted(() => ({ on: false, allowed: true }));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/consent/useConsent", () => ({ useConsentFor: () => state.allowed }));
vi.mock("@/lib/site/SiteIntegrationsProvider", () => ({
  useSiteIntegrations: () => ({ firstPartyTracking: state.on }),
}));
const tracked = vi.hoisted(() => ({ pageViewed: vi.fn(), flag: vi.fn() }));
vi.mock("@/lib/analytics/siteEvents", () => ({
  trackPageViewed: tracked.pageViewed,
  trackRouteView: vi.fn(),
  trackEngagementThreshold: vi.fn(),
  trackScrollDepth: vi.fn(),
}));
vi.mock("@/lib/analytics/engagement", () => ({ startEngagementWatch: () => () => undefined }));
vi.mock("@/lib/analytics/tracker", () => ({ setFirstPartyTracking: tracked.flag }));

import { PlatformTracker } from "./PlatformTracker";

afterEach(() => {
  cleanup();
  tracked.pageViewed.mockReset();
  tracked.flag.mockReset();
});

describe("PlatformTracker (settings phase 11: switched per market in the admin)", () => {
  it("records nothing while first-party tracking is off for the market", () => {
    state.on = false;
    render(<PlatformTracker />);
    expect(tracked.flag).toHaveBeenLastCalledWith(false);
    expect(tracked.pageViewed).not.toHaveBeenCalled();
  });

  it("tracks once the market has it on and the shopper allows analytics", () => {
    state.on = true;
    state.allowed = true;
    render(<PlatformTracker />);
    expect(tracked.flag).toHaveBeenLastCalledWith(true);
    expect(tracked.pageViewed).toHaveBeenCalledWith("/");
  });

  it("still waits for analytics consent", () => {
    state.on = true;
    state.allowed = false;
    render(<PlatformTracker />);
    expect(tracked.pageViewed).not.toHaveBeenCalled();
  });
});
