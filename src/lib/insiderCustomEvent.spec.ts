import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { insiderCustomEvent } from "@/lib/insider";
import { resetConsentCacheForTests, setConsent } from "@/lib/consent/consent";

describe("insiderCustomEvent", () => {
  beforeEach(() => {
    // Insider's tag is on for this page's market (the layout's boot script sets this).
    window.__SA_INSIDER_ON__ = true;
    window.InsiderQueue = [];
    window.Insider = { initialized: true };
    localStorage.clear();
    resetConsentCacheForTests();
    setConsent({ analytics: false, marketing: true });
  });

  it("queues nothing without marketing consent", () => {
    setConsent({ analytics: true, marketing: false });
    expect(insiderCustomEvent("cart_abandonment_eligible", { step: 1 })).toBe(false);
    expect(window.InsiderQueue).toEqual([]);
  });
  afterEach(() => {
    delete window.__SA_INSIDER_ON__;
  });

  it("reports no delivery when Insider is off for the page's market", () => {
    window.__SA_INSIDER_ON__ = false;
    expect(insiderCustomEvent("cart_abandonment_eligible", { step: 1 })).toBe(false);
    expect(window.InsiderQueue).toEqual([]);
  });

  it("queues a custom_event row with typed custom parameters and no init", () => {
    const queued = insiderCustomEvent("cart_abandonment_eligible", {
      journey_code: "WF-02",
      step: 1,
    });
    expect(queued).toBe(true);
    expect(window.InsiderQueue).toEqual([
      {
        type: "custom_event",
        value: [
          {
            event_name: "cart_abandonment_eligible",
            event_parameters: { custom: { journey_code: "WF-02", step: 1 } },
          },
        ],
      },
    ]);
  });
});
