import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: { insider: { enabled: true, accountId: "10015366", scriptHost: "x.useinsider.com" } },
}));

import { insiderCustomEvent } from "@/lib/insider";

describe("insiderCustomEvent", () => {
  beforeEach(() => {
    window.InsiderQueue = [];
    window.Insider = { initialized: true };
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
