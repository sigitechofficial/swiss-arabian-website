import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/apiError";
import { useUiStore } from "@/stores/useUiStore";
import { AccountSubscriptionDetailPageView } from "./AccountSubscriptionDetailPageView";
import { RENEWAL_CHARGE_PENDING_WARNING, SubscriptionManageSection } from "./SubscriptionManageSection";
import { SubscriptionMonthlyTracker } from "./SubscriptionMonthlyTracker";
import type { SubscriptionDetail, SubscriptionManagementActions } from "../types/subscription.types";
import { buildSubscriptionMonths } from "../utils/subscriptionMonthlyTracker";

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

const none: SubscriptionManagementActions = {
  canPause: false,
  canResume: false,
  canSkip: false,
  canCancel: false,
};

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
      {
        cycleNumber: 1,
        status: "PAID",
        sku: "VPEA107501",
        orderId: "order-1",
        orderNumber: "UAE-PAID",
      },
    ],
    actions: { ...none, canPause: true, canSkip: true, canCancel: true },
    renewalChargePending: false,
    ...overrides,
  };
}

let current = agreement();

function billingLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AccountSubscriptionDetailPageView id="sub-1" />
    </QueryClientProvider>,
  );
}

function renderSection(
  props: Partial<ComponentProps<typeof SubscriptionManageSection>> = {},
) {
  return render(
    <SubscriptionManageSection
      actions={none}
      status="ACTIVE"
      busy={false}
      onPause={async () => undefined}
      onResume={async () => undefined}
      onSkip={async () => undefined}
      onCancel={async () => undefined}
      {...props}
    />,
  );
}

describe("subscription management controls", () => {
  beforeEach(() => {
    current = agreement();
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockImplementation((path: string) => {
      if (path.includes("addresses")) return Promise.resolve([]);
      return Promise.resolve(current);
    });
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
  });

  afterEach(() => {
    cleanup();
    useUiStore.getState().selectMarket(null, null);
  });

  it("shows only the actions the backend permits", () => {
    renderSection({ actions: { ...none, canPause: true }, status: "PAUSED" });
    expect(screen.getByRole("button", { name: "Pause Subscription" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Resume Subscription" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip Next Month" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Subscription" })).not.toBeInTheDocument();
  });

  it("pauses only after confirmation and then shows the paused date", async () => {
    let release: (value: SubscriptionDetail) => void = () => undefined;
    apiPost.mockImplementation(
      () =>
        new Promise<SubscriptionDetail>((resolve) => {
          release = resolve;
        }),
    );
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Pause Subscription" }));
    expect(screen.getByText(/Future renewals will pause/)).toBeInTheDocument();
    expect(screen.getByText(/already paid stay as they are/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm pause" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm pause" })).toBeDisabled());
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`Paused ${billingLabel("2026-10-23T10:00:00.000Z")}`))).not.toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirm pause" }));
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost).toHaveBeenCalledWith("/storefront/subscriptions/sub-1/pause", {
      zoneCode: "UAE",
      reason: undefined,
    });
    current = agreement({
      status: "PAUSED",
      billingEnabled: false,
      pausedAt: "2026-10-23T10:00:00.000Z",
      actions: { ...none, canResume: true, canCancel: true },
    });
    release(current);
    expect(await screen.findByText(`Paused ${billingLabel("2026-10-23T10:00:00.000Z")}.`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume Subscription" })).toBeInTheDocument();
    expect(screen.getByText("October").parentElement).toHaveTextContent("UAE-PAID");
  });

  it("shows the next billing date returned after resume", async () => {
    current = agreement({
      status: "PAUSED",
      pausedAt: "2026-10-23T10:00:00.000Z",
      actions: { ...none, canResume: true },
    });
    apiPost.mockImplementation(async () => {
      current = agreement({
        status: "ACTIVE",
        nextBillingAt: "2027-02-22T12:30:20.177Z",
        resumedAt: "2026-10-23T11:00:00.000Z",
        actions: { ...none, canPause: true },
      });
      return current;
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Resume Subscription" }));
    expect(screen.getByText(/does not charge you now/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm resume" }));
    const resumed = billingLabel("2027-02-22T12:30:20.177Z");
    const oneMonthLater = billingLabel("2026-12-22T12:30:20.177Z");
    expect(await screen.findByText(`Next billing ${resumed}`)).toBeInTheDocument();
    expect(screen.queryByText(`Next billing ${oneMonthLater}`)).not.toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith("/storefront/subscriptions/sub-1/resume", { zoneCode: "UAE" });
  });

  it("reuses one Idempotency-Key for a failed skip and creates a new key for the next skip", async () => {
    let attempts = 0;
    apiPost.mockImplementation(async (path: string) => {
      if (!String(path).endsWith("/skip")) throw new Error(String(path));
      attempts += 1;
      if (attempts === 1) throw new TypeError("Failed to fetch");
      current = agreement({
        billingCycles: [
          {
            cycleNumber: 1,
            status: "PAID",
            sku: "VPEA107501",
            orderId: "order-1",
            orderNumber: "UAE-PAID",
          },
          { cycleNumber: 2, status: "SKIPPED", sku: "VORA141201", orderId: "should-not-link", orderNumber: "SHOULD-NOT-SHOW" },
        ],
      });
      return current;
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Skip Next Month" }));
    expect(screen.getByText(/One upcoming monthly slot will be used/)).toBeInTheDocument();
    expect(screen.getByText(/no order is created/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm skip" }));
    expect(await screen.findByText(/Check your connection/)).toBeInTheDocument();
    const firstKey = (apiPost.mock.calls[0]?.[2] as { headers: { "Idempotency-Key": string } }).headers["Idempotency-Key"];
    fireEvent.click(screen.getByRole("button", { name: "Confirm skip" }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(2));
    const secondKey = (apiPost.mock.calls[1]?.[2] as { headers: { "Idempotency-Key": string } }).headers["Idempotency-Key"];
    expect(secondKey).toBe(firstKey);
    await waitFor(() => expect(screen.getByText("Month 2").parentElement).toHaveTextContent("Skipped"));
    expect(screen.getByText("Month 2").parentElement).toHaveTextContent("VORA141201");
    expect(screen.getByText("Month 2").parentElement).not.toHaveTextContent("SHOULD-NOT-SHOW");
    expect(screen.getByText("October").parentElement).toHaveTextContent("UAE-PAID");
    expect(screen.getAllByRole("link", { name: "Track order" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Skip Next Month" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm skip" }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(3));
    const thirdKey = (apiPost.mock.calls[2]?.[2] as { headers: { "Idempotency-Key": string } }).headers["Idempotency-Key"];
    expect(thirdKey).not.toBe(firstKey);
    expect(apiPost.mock.calls[0]?.[0]).toBe("/storefront/subscriptions/sub-1/skip");
  });

  it("maps a skipped cycle without an order and keeps the paid cycle", () => {
    const months = buildSubscriptionMonths({
      mode: "QUEUE",
      status: "ACTIVE",
      billingEnabled: true,
      nextBillingAt: "2026-12-22T12:30:20.177Z",
      queue: [
        { variantId: "a", sku: "VPEA107501", position: 1, quantity: 1 },
        { variantId: "b", sku: "VORA141201", position: 2, quantity: 1 },
        { variantId: "c", sku: "PLANNED-3", position: 3, quantity: 1 },
      ],
      cycles: [
        { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
        { cycleNumber: 2, status: "SKIPPED", sku: "VORA141201", orderId: "should-not-link", orderNumber: "SHOULD-NOT-SHOW" },
      ],
    });
    expect(months[1]).toMatchObject({
      fragrance: "VORA141201",
      payment: "SKIPPED",
      orderId: null,
      orderNumber: null,
      trackHref: null,
      billingDate: null,
    });
    expect(months[0]).toMatchObject({ payment: "PAID", orderNumber: "UAE-PAID", orderId: "order-1" });
    expect(months[2]?.payment).toBe("UPCOMING");
    expect(months[2]?.fragrance).toBe("PLANNED-3");
    render(
      <SubscriptionMonthlyTracker
        detail={agreement({
          billingCycles: [
            { cycleNumber: 1, status: "PAID", sku: "VPEA107501", orderId: "order-1", orderNumber: "UAE-PAID" },
            { cycleNumber: 2, status: "SKIPPED", sku: "VORA141201", orderId: "should-not-link", orderNumber: "SHOULD-NOT-SHOW" },
          ],
        })}
      />,
    );
    const skippedMonth = screen.getByText(/VORA141201/).closest("li");
    expect(skippedMonth).toHaveTextContent("Skipped");
    expect(skippedMonth).not.toHaveTextContent("SHOULD-NOT-SHOW");
    expect(screen.getByText(/UAE-PAID/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Track order" })).toHaveLength(1);
  });

  it("cancels only after the irreversible confirmation", async () => {
    apiPost.mockImplementation(async () => {
      current = agreement({
        status: "CANCELLED",
        billingEnabled: false,
        actions: none,
      });
      return current;
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Cancel Subscription" }));
    expect(screen.getByText(/stops future eligible renewals/)).toBeInTheDocument();
    expect(screen.getByText(/does not refund or cancel/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith(
      "/storefront/subscriptions/sub-1/cancel",
      { zoneCode: "UAE", reason: undefined },
    );
    expect(screen.queryByRole("button", { name: "Cancel Subscription" })).not.toBeInTheDocument();
    expect(screen.getByText("October").parentElement).toHaveTextContent("UAE-PAID");
  });

  it("shows the in-progress renewal warning and the backend error without changing status", async () => {
    current = agreement({ renewalChargePending: true });
    apiPost.mockRejectedValue(new ApiClientError(409, { message: "A renewal charge is already in progress." }));
    renderPage();
    expect(await screen.findByText(RENEWAL_CHARGE_PENDING_WARNING)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause Subscription" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm pause" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A renewal charge is already in progress.");
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText(/^Paused /)).not.toBeInTheDocument();
  });
});
