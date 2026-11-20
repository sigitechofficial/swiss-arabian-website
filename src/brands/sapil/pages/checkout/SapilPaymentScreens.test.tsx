import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";

const state = vi.hoisted(() => ({
  push: null as null | ((href: string) => void),
  returnToCheckout: null as null | ((orderId: string, opts: { declined?: boolean; provider?: string }) => Promise<{ kind: string }>),
  params: new URLSearchParams(),
  path: "/checkout/payment/cancel",
  stored: null as string | null,
  settlement: null as null | { kind: string; status?: string },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => state.params,
  usePathname: () => state.path,
  useRouter: () => ({ push: (href: string) => state.push?.(href), replace: vi.fn() }),
}));
vi.mock("@/features/checkout/utils/returnToCheckout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/checkout/utils/returnToCheckout")>()),
  returnToCheckout: (orderId: string, opts: { declined?: boolean; provider?: string }) => state.returnToCheckout!(orderId, opts),
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

import { SapilPaymentCancel, SapilPaymentSuccess, SapilTabbyReturn, SapilTamaraReturn } from "./SapilPaymentScreens";

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
  });

  it("tabby cancelled: back to checkout with the bag, Tabby still offered (Tabby QA)", async () => {
    state.params = new URLSearchParams("result=cancel");
    state.stored = "order-1";
    state.settlement = { kind: "failed", status: "CANCELLED" };
    const pushed: string[] = [];
    state.push = (href) => pushed.push(href);
    const calls: Array<[string, { declined?: boolean; provider?: string }]> = [];
    state.returnToCheckout = async (orderId, opts) => {
      calls.push([orderId, opts]);
      return { kind: "checkout" };
    };
    await renderIn("en", <SapilTabbyReturn />);
    fireEvent.click(screen.getByRole("button", { name: "Back to checkout" }));
    await waitFor(() => expect(pushed).toEqual(["/checkout"]));
    expect(calls).toEqual([["order-1", { declined: false, provider: "tabby" }]]);
  });

  it("tabby declined: the bag comes back without Tabby; an open payment keeps the order", async () => {
    state.params = new URLSearchParams("result=failure");
    state.stored = "order-1";
    state.settlement = { kind: "failed", status: "FAILED" };
    const calls: Array<[string, { declined?: boolean; provider?: string }]> = [];
    state.returnToCheckout = async (orderId, opts) => {
      calls.push([orderId, opts]);
      return { kind: "kept" };
    };
    await renderIn("en", <SapilTabbyReturn />);
    expect(screen.getAllByRole("alert")[0]!.textContent).toMatch(/Tabby is unable to approve/);
    fireEvent.click(screen.getByRole("button", { name: "Choose another payment method" }));
    await waitFor(() => expect(screen.getByText(/still being processed/)).toBeTruthy());
    expect(calls).toEqual([["order-1", { declined: true, provider: "tabby" }]]);
  });
  it("tamara cancelled: back to checkout with the bag, Tamara still offered", async () => {
    state.params = new URLSearchParams("result=cancel");
    state.stored = "order-1";
    state.settlement = { kind: "failed", status: "CANCELLED" };
    const pushed: string[] = [];
    state.push = (href) => pushed.push(href);
    const calls: Array<[string, { declined?: boolean; provider?: string }]> = [];
    state.returnToCheckout = async (orderId, opts) => {
      calls.push([orderId, opts]);
      return { kind: "checkout" };
    };
    await renderIn("en", <SapilTamaraReturn />);
    fireEvent.click(screen.getByRole("button", { name: "Back to checkout" }));
    await waitFor(() => expect(pushed).toEqual(["/checkout"]));
    expect(calls).toEqual([["order-1", { declined: false, provider: "tamara" }]]);
  });

  it("tamara declined: the bag comes back without Tamara", async () => {
    state.params = new URLSearchParams("result=failure");
    state.stored = "order-1";
    state.settlement = { kind: "failed", status: "FAILED" };
    const calls: Array<[string, { declined?: boolean; provider?: string }]> = [];
    state.returnToCheckout = async (orderId, opts) => {
      calls.push([orderId, opts]);
      return { kind: "kept" };
    };
    await renderIn("en", <SapilTamaraReturn />);
    expect(screen.getAllByRole("alert")[0]!.textContent).toMatch(/Tamara could not approve/);
    fireEvent.click(screen.getByRole("button", { name: "Choose another payment method" }));
    await waitFor(() => expect(screen.getByText(/still being processed/)).toBeTruthy());
    expect(calls).toEqual([["order-1", { declined: true, provider: "tamara" }]]);
  });
});
