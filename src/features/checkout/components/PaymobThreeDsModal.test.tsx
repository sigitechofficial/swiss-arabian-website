import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  capture: null as null | ((url: string) => void),
  settle: { success: false, status: "DECLINED" },
}));

vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));
vi.mock("../api/orders.service", () => ({
  pollUntilPaymentSettles: vi.fn(async () => state.settle),
}));
vi.mock("../utils/paymobThreeDs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/paymobThreeDs")>()),
  installPaymobThreeDsCapture: (callback: (url: string) => void) => {
    state.capture = callback;
    return () => undefined;
  },
  finishPaidCheckout: vi.fn(),
}));

import {
  paymobThreeDsErrorText,
  usePaymobThreeDsModal,
  type PaymobThreeDsModalProps,
} from "./PaymobThreeDsModal";

function BrandModal({ src }: PaymobThreeDsModalProps) {
  return <div data-testid="brand-modal">{src}</div>;
}

function Harness({ custom = false }: { custom?: boolean }) {
  const threeDs = usePaymobThreeDsModal("order-1", custom ? { Modal: BrandModal } : undefined);
  return (
    <div>
      <p data-testid="code">{threeDs.challengeErrorCode ?? ""}</p>
      <p data-testid="text">{threeDs.challengeError ?? ""}</p>
      {threeDs.overlay}
    </div>
  );
}

beforeEach(() => {
  state.capture = null;
  state.settle = { success: false, status: "DECLINED" };
});

describe("usePaymobThreeDsModal", () => {
  it("draws Swiss Arabian's overlay by default and words a decline in its sentence", async () => {
    render(<Harness />);
    act(() => state.capture?.("https://acs.example.test/3ds"));
    expect(screen.getByRole("dialog").textContent).toMatch(/Confirming your payment/);
    await waitFor(() => expect(screen.getByTestId("code").textContent).toBe("declined"));
    expect(screen.getByTestId("text").textContent).toBe("Your card was declined. Please try another card.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses a brand's own overlay and gives the error as a code", async () => {
    state.settle = { success: false, status: "FAILED" };
    render(<Harness custom />);
    act(() => state.capture?.("https://acs.example.test/3ds"));
    expect(screen.getByTestId("brand-modal").textContent).toBe("https://acs.example.test/3ds");
    expect(screen.queryByText(/Confirming your payment/)).toBeNull();
    await waitFor(() => expect(screen.getByTestId("code").textContent).toBe("unconfirmed"));
  });

  it("keeps Swiss Arabian's sentences", () => {
    expect(paymobThreeDsErrorText("cancelled")).toBe("Payment was cancelled. You can try again with the same card.");
    expect(paymobThreeDsErrorText("unconfirmed")).toMatch(/^We couldn’t confirm your payment/);
  });
});
