import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/apiError";
import { useUiStore } from "@/stores/useUiStore";
import { AccountSubscriptionDetailPageView } from "./AccountSubscriptionDetailPageView";
import { PAYMENT_RETRY_UNCONFIRMED } from "../utils/subscriptionManagement";
import { buildSubscriptionMonths } from "../utils/subscriptionMonthlyTracker";
import type { SubscriptionDetail, SubscriptionPaymentRecovery } from "../types/subscription.types";

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiPut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/account/subscription/sub-1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/motion", () => ({
  Reveal: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

function recovery(overrides: Partial<SubscriptionPaymentRecovery> = {}): SubscriptionPaymentRecovery {
  return {
    cycleNumber: 2,
    status: "FAILED",
    retryEligible: true,
    customerActionRequired: false,
    message: "The renewal payment did not complete. This month has not moved forward.",
    ...overrides,
  };
}

function agreement(overrides: Partial<SubscriptionDetail> = {}): SubscriptionDetail {
  return {
    id: "sub-1",
    planId: "plan",
    planCode: "MONTHLY_65",
    planVersionId: "ver",
    versionNumber: 1,
    amount: "60.00",
    currencyCode: "AED",
    shippingMode: "INCLUDED",
    shippingAmount: "0.00",
    monthlyTotal: "60.00",
    intervalUnit: "MONTH",
    intervalCount: 1,
    selectionMode: "QUEUE",
    audience: "MEN",
    status: "ACTIVE",
    billingEnabled: true,
    nextBillingAt: "2026-11-22T12:30:20.177Z",
    registeredAt: "2026-10-22T00:00:00.000Z",
    planStatus: "PUBLISHED",
    billable: true,
    queue: [
      { variantId: "a", sku: "VPEA107501", position: 1, quantity: 1 },
      { variantId: "b", sku: "VORA141201", position: 2, quantity: 1 },
    ],
    consent: null,
    billingCycles: [
      { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
      { cycleNumber: 2, status: "FAILED", sku: "VORA141201" },
      { cycleNumber: 3, status: "SKIPPED", sku: "VORA141201" },
    ],
    actions: { canPause: true, canResume: false, canSkip: true, canCancel: true, canReplacePaymentMethod: false },
    paymentRecovery: recovery(),
    ...overrides,
  };
}

let current = agreement();

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AccountSubscriptionDetailPageView id="sub-1" />
    </QueryClientProvider>,
  );
}

async function confirmRetry() {
  fireEvent.click(await screen.findByRole("button", { name: "Retry Payment" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm retry" }));
}

function trackerMonth(month: number): HTMLLIElement {
  const row = screen
    .getAllByText(`Month ${month}`)
    .map((node) => node.closest("li"))
    .find((node): node is HTMLLIElement => node instanceof HTMLLIElement);
  if (!row) throw new Error(`Month ${month} is not in the tracker`);
  return row;
}

describe("subscription payment recovery", () => {
  beforeEach(() => {
    current = agreement();
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockImplementation((path: string) => {
      if (String(path).includes("addresses")) return Promise.resolve([]);
      if (String(path).includes("consent")) return Promise.resolve({ available: false });
      return Promise.resolve(current);
    });
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
  });

  afterEach(() => {
    cleanup();
    useUiStore.getState().selectMarket(null, null);
  });

  it("shows Retry Payment when the failed cycle is eligible", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Payment recovery" })).toBeInTheDocument();
    expect(screen.getByText("The renewal payment did not complete. This month has not moved forward.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Payment" })).toBeEnabled();
    expect(screen.getAllByText("Month 2").length).toBeGreaterThan(0);
  });

  it("hides Retry Payment when the backend says it is not eligible", async () => {
    current = agreement({ paymentRecovery: recovery({ retryEligible: false }) });
    renderPage();
    expect(await screen.findByRole("heading", { name: "Payment recovery" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry Payment" })).not.toBeInTheDocument();
    cleanup();
    current = agreement({ paymentRecovery: recovery({ status: "NONE", retryEligible: false, message: null, cycleNumber: null }) });
    renderPage();
    await screen.findByText("MONTHLY_65");
    expect(screen.queryByRole("heading", { name: "Payment recovery" })).not.toBeInTheDocument();
  });

  it("shows the action-required message without an authentication link", async () => {
    current = agreement({
      paymentRecovery: recovery({
        status: "ACTION_REQUIRED",
        customerActionRequired: true,
        message: "The bank needs to confirm this card, or replace the card and retry. Nothing new has been charged.",
      }),
      billingCycles: [
        { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
        { cycleNumber: 2, status: "ACTION_REQUIRED", sku: "VORA141201" },
      ],
    });
    renderPage();
    expect(await screen.findByText(/Nothing new has been charged/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Payment" })).toBeInTheDocument();
    expect(screen.queryByText(/authentication was completed/i)).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/stripe\.com|authenticate/i);
  });

  it("blocks retry while a payment is processing or still being verified", async () => {
    current = agreement({
      paymentRecovery: recovery({
        status: "PROCESSING",
        retryEligible: false,
        message: "A renewal payment is still being confirmed. It has not been marked failed.",
      }),
      billingCycles: [
        { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
        { cycleNumber: 2, status: "PROCESSING", sku: "VORA141201" },
      ],
    });
    renderPage();
    expect(await screen.findByText("Payment processing.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry Payment" })).not.toBeInTheDocument();
    expect(trackerMonth(2)).toHaveTextContent("Processing");
    expect(trackerMonth(2)).not.toHaveTextContent("Paid");
    cleanup();

    current = agreement({
      paymentRecovery: recovery({
        status: "RECONCILIATION_REQUIRED",
        retryEligible: false,
        message: "A renewal payment is still being confirmed. It has not been marked failed.",
      }),
      billingCycles: [
        { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
        { cycleNumber: 2, status: "RECONCILIATION_REQUIRED", sku: "VORA141201" },
      ],
    });
    renderPage();
    expect(await screen.findByText("Payment verification pending.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry Payment" })).not.toBeInTheDocument();
    expect(trackerMonth(2)).toHaveTextContent("Needs review");
    expect(trackerMonth(2)).not.toHaveTextContent("Payment failed");
  });

  it("does not offer a payment retry when the order is still being recovered", async () => {
    current = agreement({
      paymentRecovery: recovery({
        status: "ORDER_RECOVERY",
        retryEligible: false,
        message: "This month is paid. The order is still being recovered. The card is not charged again.",
      }),
      billingCycles: [
        { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
        { cycleNumber: 2, status: "PAID", sku: "VORA141201" },
      ],
    });
    renderPage();
    expect(await screen.findByText("Payment received — Order confirmation in progress.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry Payment" })).not.toBeInTheDocument();
    expect(trackerMonth(2)).toHaveTextContent("Paid");
    expect(trackerMonth(2)).toHaveTextContent("Order pending");
    expect(trackerMonth(2).textContent).not.toMatch(/UAE-/);
  });

  it("sends one retry request when Confirm retry is clicked twice", async () => {
    let release: (value: SubscriptionDetail) => void = () => undefined;
    apiPost.mockImplementation(
      () =>
        new Promise<SubscriptionDetail>((resolve) => {
          release = resolve;
        }),
    );
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Retry Payment" }));
    const confirm = screen.getByRole("button", { name: "Confirm retry" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    expect(apiPost).toHaveBeenCalledWith("/storefront/subscriptions/sub-1/payment/retry", { zoneCode: "UAE" });
    const body = apiPost.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("amount");
    expect(body).not.toHaveProperty("instrumentId");
    expect(body).not.toHaveProperty("cycleNumber");
    release(current);
  });

  it("refreshes after an ambiguous network error and does not replay the retry", async () => {
    apiPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderPage();
    const getsBefore = apiGet.mock.calls.length;
    await confirmRetry();
    expect(await screen.findByRole("alert")).toHaveTextContent(PAYMENT_RETRY_UNCONFIRMED);
    expect(screen.getByRole("alert")).not.toHaveTextContent(/charge failed/i);
    await waitFor(() => expect(apiGet.mock.calls.length).toBeGreaterThan(getsBefore));
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Retry Payment" })).toBeInTheDocument();

    current = agreement({ paymentRecovery: recovery({ retryEligible: false }) });
    apiPost.mockRejectedValueOnce(new TypeError("timeout"));
    await confirmRetry();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry Payment" })).not.toBeInTheDocument());
    expect(apiPost).toHaveBeenCalledTimes(2);

    for (const status of [401, 403, 404, 409, 422]) {
      cleanup();
      current = agreement();
      apiPost.mockReset();
      apiPost.mockRejectedValueOnce(new ApiClientError(status, { message: `backend ${status}`, code: `CODE_${status}` }));
      renderPage();
      await confirmRetry();
      expect(await screen.findByRole("alert")).toHaveTextContent(`backend ${status}`);
      expect(screen.getByRole("alert")).not.toHaveTextContent(/charge failed/i);
      expect(apiPost).toHaveBeenCalledTimes(1);
    }
  });

  it("updates the monthly tracker from the returned subscription detail", async () => {
    const updated = agreement({
      paymentRecovery: recovery({ status: "NONE", retryEligible: false, message: null, cycleNumber: null }),
      billingCycles: [
        { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
        { cycleNumber: 2, status: "PAID", sku: "VORA141201", orderId: "order-2", orderNumber: "UAE-ORDER-2" },
        { cycleNumber: 3, status: "SKIPPED", sku: "VORA141201" },
      ],
    });
    apiPost.mockImplementation(async () => {
      current = updated;
      return updated;
    });
    renderPage();
    expect(await screen.findByRole("heading", { name: "Payment recovery" })).toBeInTheDocument();
    expect(trackerMonth(2)).toHaveTextContent("Payment failed");
    await confirmRetry();
    await waitFor(() => expect(trackerMonth(2)).toHaveTextContent("UAE-ORDER-2"));
    expect(trackerMonth(2)).toHaveTextContent("Paid");
    expect(trackerMonth(1)).toHaveTextContent("UAE-PAID");
    expect(trackerMonth(3)).toHaveTextContent("Skipped");
    expect(screen.queryByRole("heading", { name: "Payment recovery" })).not.toBeInTheDocument();
    expect(buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: null,
      queue: [],
      cycles: [{ cycleNumber: 2, status: "PROCESSING" }],
    })[1]?.payment).toBe("PROCESSING");
  });

  it("follows the backend card-replacement permission", async () => {
    current = agreement({
      paymentMethod: { brand: "visa", last4: "4242", expiryMonth: 12, expiryYear: 2030, status: "ACTIVE" },
      actions: { canPause: true, canResume: false, canSkip: false, canCancel: true, canReplacePaymentMethod: true },
    });
    renderPage();
    expect(await screen.findByRole("button", { name: "Change Payment Method" })).toBeInTheDocument();
    expect(screen.getByText("Change Payment Method is available below before you retry.")).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
    cleanup();

    current = agreement({
      paymentMethod: { brand: "visa", last4: "4242", expiryMonth: 12, expiryYear: 2030, status: "ACTIVE" },
      paymentRecovery: recovery({
        status: "PROCESSING",
        retryEligible: false,
        message: "A renewal payment is still being confirmed. It has not been marked failed.",
      }),
      actions: { canPause: false, canResume: false, canSkip: false, canCancel: true, canReplacePaymentMethod: false },
    });
    renderPage();
    expect(await screen.findByText("Payment processing.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change Payment Method" })).not.toBeInTheDocument();
    expect(screen.queryByText("Change Payment Method is available below before you retry.")).not.toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });
});
