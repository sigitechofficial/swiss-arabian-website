import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppliedCampaigns } from "./AppliedCampaigns";
import type { PromotionSnapshotV1 } from "../types/promotions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cart",
  useRouter: () => ({ push: vi.fn() }),
}));

function snapshot(amount: string, percentage: string): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: null,
    context: { brandCode: "SWISS_ARABIAN", zoneCode: "URD1", currencyCode: "AED", salesChannelCode: null },
    applied: [
      {
        kind: "AUTOMATIC",
        code: "TIER",
        label: "Spend AED 500.00+ and save 15%",
        discountType: "PERCENTAGE",
        discountValue: percentage,
        level: "ORDER",
        amount,
        metadata: {
          basis: "ELIGIBLE_SUBTOTAL",
          selectedTier: { minAmount: "500.00", percentage },
          eligibleSubtotal: "650.00",
        },
      },
    ],
    lineAllocations: [],
    totals: { discountTotal: amount },
    rejected: [],
  };
}

describe("FE20 tiered spend rendering", () => {
  afterEach(() => cleanup());

  it("prints the server tier label and the server amount", () => {
    render(<AppliedCampaigns snapshot={snapshot("97.50", "15.0000")} />);
    expect(screen.getByText("Spend AED 500.00+ and save 15%")).toBeTruthy();
    expect(screen.getByText(/15% off/)).toBeTruthy();
    expect(screen.getByText(/97\.50/)).toBeTruthy();
  });

  it("prints the capped server amount without recomputing 20%", () => {
    render(<AppliedCampaigns snapshot={snapshot("250.00", "20.0000")} />);
    expect(screen.getByText(/250\.00/)).toBeTruthy();
    expect(screen.queryByText(/400/)).toBeNull();
  });
});
