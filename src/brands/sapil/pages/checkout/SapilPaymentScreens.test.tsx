import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";

const state = vi.hoisted(() => ({
  params: new URLSearchParams(),
  path: "/checkout/payment/cancel",
  stored: null as string | null,
  settlement: null as null | { kind: string; status?: string },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => state.params,
  usePathname: () => state.path,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));
vi.mock("@/features/checkout/hooks/usePaymentReturn", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/checkout/hooks/usePaymentReturn")>()),
  storedOrderIdIf: () => state.stored,
  useSettlePayment: () => state.settlement,
}));
vi.mock("@/features/checkout/utils/checkoutSession", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/checkout/utils/checkoutSession")>()),
  getStoredOrderNumber: () => "SP-1001",
}));

import { SapilPaymentCancel, SapilPaymentSuccess, SapilTabbyReturn } from "./SapilPaymentScreens";

async function renderIn(locale: "en" | "ar", ui: React.ReactNode) {
  state.path = locale === "ar" ? "/ar/checkout/payment/cancel" : "/checkout/payment/cancel";
  const messages = await loadSapilMessages(locale);
  return render(<SapilCopyProvider messages={messages}>{ui}</SapilCopyProvider>);
}

beforeEach(() => {
  state.params = new URLSearchParams();
  state.stored = null;
  state.settlement = null;
});

describe("Sapil payment screens", () => {
  it("cancel: keeps the order, offers a retry, shows the gateway error in Sapil wording", async () => {
    state.stored = "order-1";
    state.params = new URLSearchParams("reason=gateway");
    await renderIn("en", <SapilPaymentCancel />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Your order is saved.");
    expect(screen.getByText(/Order SP-1001 is waiting for payment/)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/Card payment couldn’t be started/);
    expect(screen.getByRole("button", { name: "Retry payment" })).toBeTruthy();
  });

  it("cancel without an order sends the shopper back to the bag, in Arabic", async () => {
    await renderIn("ar", <SapilPaymentCancel />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("انتهت جلسة الدفع هذه.");
    expect(screen.getByRole("link", { name: "العودة إلى الحقيبة" })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/[A-Za-z]{4,}/);
  });

  it("success: declined payment offers another try", async () => {
    state.stored = "order-1";
    state.settlement = { kind: "failed", status: "DECLINED" };
    await renderIn("en", <SapilPaymentSuccess />);
    expect(screen.getByText("Payment declined")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Try again" })).toBeTruthy();
  });

  it("tabby: a refusal shows Tabby's required wording", async () => {
    state.params = new URLSearchParams("result=cancel");
    state.stored = "order-1";
    state.settlement = { kind: "failed", status: "CANCELLED" };
    await renderIn("en", <SapilTabbyReturn />);
    expect(screen.getByRole("alert").textContent).toMatch(/You aborted the payment/);
    expect(screen.getByRole("link", { name: "Choose another payment method" }).getAttribute("href")).toContain("/checkout/payment/cancel?orderId=order-1");
  });
});
