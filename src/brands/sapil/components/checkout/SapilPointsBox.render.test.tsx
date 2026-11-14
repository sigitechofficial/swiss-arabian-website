import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { SapilPointsBox } from "./SapilPointsBox";

const state = vi.hoisted(() => ({ loyaltyOn: true, redemption: {} as Record<string, unknown> }));

vi.mock("@/lib/brand/features", () => ({ brandFeatureEnabled: () => state.loyaltyOn }));
vi.mock("@/features/loyalty/hooks/useLoyaltyRedemption", () => ({ useLoyaltyRedemption: () => state.redemption }));
vi.mock("@/features/loyalty/hooks/useLoyaltyAccount", () => ({ useLoyaltyAccount: () => ({ wallet: { data: { availableValue: 12.5, currencyCode: "AED" } } }) }));
vi.mock("@/features/markets/hooks/useMarketCurrency", () => ({ useMarketCurrency: () => "AED" }));
vi.mock("../commerce/shared", () => ({ useSapilMoney: () => (n: number, c: string) => `${c} ${n}` }));

const quote = (over: Record<string, unknown> = {}) => ({
  enabled: true,
  eligible: true,
  availablePoints: 1250,
  minimumRedeemPoints: 100,
  incrementPoints: 50,
  maxRedeemablePoints: 1000,
  appliedPoints: 0,
  appliedAmount: 0,
  currencyCode: "AED",
  reason: null,
  reasonMessage: null,
  ...over,
});

function setRedemption(over: Record<string, unknown> = {}) {
  state.redemption = {
    quote: quote(),
    hidden: false,
    cartId: "cart-1",
    adjusted: false,
    acknowledgeAdjustment: vi.fn(),
    apply: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
    remove: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
    ...over,
  };
}

describe("SapilPointsBox", () => {
  beforeEach(() => {
    state.loyaltyOn = true;
    setRedemption();
  });

  it("stays hidden while the brand's loyalty is switched off", () => {
    state.loyaltyOn = false;
    const { container } = render(<SapilPointsBox />);
    expect(container.innerHTML).toBe("");
  });

  it("shows the points available and applies the amount typed", async () => {
    render(<SapilPointsBox />);
    expect(screen.getByText("1,250 points available · worth AED 12.5")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use the most I can (1,000)" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect((state.redemption.apply as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync).toHaveBeenCalledWith(1000));
  });

  it("shows applied points with change and remove", async () => {
    setRedemption({ quote: quote({ appliedPoints: 500, appliedAmount: 5 }) });
    render(<SapilPointsBox />);
    expect(screen.getByText("500 points applied")).toBeTruthy();
    expect(screen.getByText("−AED 5")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect((state.redemption.remove as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync).toHaveBeenCalled());
  });

  it("explains a refusal in the shopper's words", async () => {
    const apply = { mutateAsync: vi.fn().mockRejectedValue(new ApiClientError(422, { code: "INSUFFICIENT_POINTS", message: "x" })), isPending: false };
    setRedemption({ apply });
    render(<SapilPointsBox />);
    fireEvent.change(screen.getByLabelText("Points to use"), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("You don’t have enough points.")).toBeTruthy();
  });

  it("says why points can't be used when the bag doesn't qualify", () => {
    setRedemption({ quote: quote({ eligible: false, reason: "CART_NOT_QUALIFIED", reasonMessage: "server text" }) });
    render(<SapilPointsBox />);
    expect(screen.getByText("Reward points can’t be used on this bag yet.")).toBeTruthy();
  });
});
