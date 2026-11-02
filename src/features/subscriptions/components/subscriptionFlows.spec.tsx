import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/apiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { AccountSubscriptionDetailPageView } from "./AccountSubscriptionDetailPageView";
import { AccountSubscriptionsPageView } from "./AccountSubscriptionsPageView";
import { PlanSelectionPageView } from "./PlanSelectionPageView";

const listMySubscriptions = vi.hoisted(() => vi.fn());
const getSubscriptionPlan = vi.hoisted(() => vi.fn());
const listPlanProducts = vi.hoisted(() => vi.fn());
const getMySubscription = vi.hoisted(() => vi.fn());
const replaceSubscriptionQueue = vi.hoisted(() => vi.fn());
const changeSelectionMode = vi.hoisted(() => vi.fn());
const cancelSubscription = vi.hoisted(() => vi.fn());
const registerSubscription = vi.hoisted(() => vi.fn());
const getSubscriptionConsent = vi.hoisted(() => vi.fn());
const listCustomerAddresses = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/subscriptions/MONTHLY_65",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/motion", () => ({
  Reveal: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../api/subscription.api", () => ({
  listMySubscriptions: (...args: unknown[]) => listMySubscriptions(...args),
  getSubscriptionPlan: (...args: unknown[]) => getSubscriptionPlan(...args),
  listPlanProducts: (...args: unknown[]) => listPlanProducts(...args),
  getMySubscription: (...args: unknown[]) => getMySubscription(...args),
  replaceSubscriptionQueue: (...args: unknown[]) => replaceSubscriptionQueue(...args),
  changeSelectionMode: (...args: unknown[]) => changeSelectionMode(...args),
  cancelSubscription: (...args: unknown[]) => cancelSubscription(...args),
  registerSubscription: (...args: unknown[]) => registerSubscription(...args),
  getSubscriptionConsent: (...args: unknown[]) => getSubscriptionConsent(...args),
}));

vi.mock("@/features/account/api/customerAccount.service", () => ({
  listCustomerAddresses: (...args: unknown[]) => listCustomerAddresses(...args),
}));

function renderWith(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    ...render(<QueryClientProvider client={client}>{node}</QueryClientProvider>),
  };
}

const publishedPlan = {
  planCode: "MONTHLY_65",
  name: "Monthly",
  description: null,
  amount: "65.00",
  currencyCode: "AED",
  intervalUnit: "MONTH",
  intervalCount: 1,
  versionNumber: 1,
  publishedAt: "2026-10-19T00:00:00.000Z",
};

const unavailableConsent = {
  available: false,
  version: null,
  text: null,
  publishedAt: null,
};

function signIn() {
  useAuthStore.setState({
    isAuthenticated: true,
    bootstrapped: true,
    user: { id: "c", email: "a@b.c" },
  });
}

function renderPlan() {
  getSubscriptionPlan.mockResolvedValue(publishedPlan);
  listPlanProducts.mockResolvedValue([]);
  return renderWith(<PlanSelectionPageView planCode="MONTHLY_65" />);
}

async function chooseAudience(label: "Men" | "Women") {
  const callsBefore = listPlanProducts.mock.calls.length;
  fireEvent.click(await screen.findByRole("button", { name: label }));
  await waitFor(() => expect(listPlanProducts.mock.calls.length).toBeGreaterThan(callsBefore));
  await waitFor(() => expect(screen.queryByText("Loading this plan…")).not.toBeInTheDocument());
}

describe("account subscriptions and registration gate", () => {
  beforeEach(() => {
    getSubscriptionConsent.mockResolvedValue(unavailableConsent);
    listCustomerAddresses.mockResolvedValue([]);
    registerSubscription.mockReset();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    useAuthStore.getState().reset();
    useUiStore.getState().selectMarket(null, null);
  });

  it("lists two agreements on the same plan as separate cards", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
    const shared = {
      planId: "plan",
      planCode: "MONTHLY_65",
      planVersionId: "ver",
      versionNumber: 1,
      amount: "65.00",
      currencyCode: "AED",
      intervalUnit: "MONTH",
      intervalCount: 1,
      billingEnabled: false,
      nextBillingAt: null,
      registeredAt: "2026-10-19T00:00:00.000Z",
      planStatus: "PUBLISHED",
    };
    listMySubscriptions.mockResolvedValue([
      { ...shared, id: "one", selectionMode: "QUEUE", status: "PENDING_ACTIVATION" },
      { ...shared, id: "two", selectionMode: "SURPRISE", status: "CANCELLED" },
    ]);
    renderWith(<AccountSubscriptionsPageView />);
    expect(await screen.findByText("Pending activation")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getAllByText("MONTHLY_65")).toHaveLength(2);
    expect(screen.queryByText(/payment successful/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next charge/i)).not.toBeInTheDocument();
  });

  it("sends an unauthenticated customer to login", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE" });
    useAuthStore.setState({ isAuthenticated: false, bootstrapped: true, user: null });
    getSubscriptionPlan.mockResolvedValue(publishedPlan);
    listPlanProducts.mockResolvedValue([
      { variantId: "v-high", productId: "p", sku: "HIGH", name: "Costly rose" },
    ]);
    renderWith(<PlanSelectionPageView planCode="MONTHLY_65" />);
    fireEvent.click(await screen.findByRole("button", { name: "Men" }));
    expect(await screen.findByText("Costly rose")).toBeInTheDocument();
    expect(listPlanProducts).toHaveBeenCalledWith("MONTHLY_65", "UAE", "MEN");
    const link = screen.getByRole("link", { name: "Sign in to register" });
    expect(link).toHaveAttribute("href", "/login?returnTo=%2Fsubscriptions%2FMONTHLY_65");
    expect(screen.queryByText(/1449/)).not.toBeInTheDocument();
  });

  it("blocks registration when no active consent is published", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    renderPlan();
    expect(await screen.findByText(/approved agreement is published/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save registration" })).toBeDisabled();
    expect(registerSubscription).not.toHaveBeenCalled();
  });

  it("shows the exact published wording and submits that version", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    listCustomerAddresses.mockResolvedValue([
      { id: "addr-1", address1: "1 Rose Street", city: "Dubai", country: "AE" },
    ]);
    getSubscriptionConsent.mockResolvedValue({
      available: true,
      version: "market-live-1",
      text: "Exact published wording for Swiss Arabian UAE.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    });
    registerSubscription.mockResolvedValue({
      id: "sub-new",
      amount: "65.00",
      currencyCode: "AED",
      selectionMode: "SURPRISE",
      status: "PENDING_ACTIVATION",
      billingEnabled: false,
      nextBillingAt: null,
    });
    renderPlan();
    expect(await screen.findByText("Exact published wording for Swiss Arabian UAE.")).toBeInTheDocument();
    await chooseAudience("Men");
    fireEvent.click(screen.getByRole("button", { name: "Surprise Me" }));
    const save = screen.getByRole("button", { name: "Save registration" });
    expect(save).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "addr-1" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(registerSubscription).toHaveBeenCalledTimes(1));
    expect(registerSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneCode: "UAE",
        planCode: "MONTHLY_65",
        mode: "SURPRISE",
        audience: "MEN",
        customerAddressId: "addr-1",
        consentTextVersion: "market-live-1",
      }),
      expect.any(String),
    );
    expect(registerSubscription.mock.calls[0]?.[0]).not.toHaveProperty("variantIds");
    expect(registerSubscription.mock.calls[0]?.[0]).not.toHaveProperty("scheduleVersionId");
    expect(await screen.findByText("Status: Pending activation.")).toBeInTheDocument();
    expect(screen.getByText("No payment has been collected.")).toBeInTheDocument();
    expect(screen.getByText("No order has been created.")).toBeInTheDocument();
    expect(screen.queryByText(/payment successful/i)).not.toBeInTheDocument();
  });

  it("keeps registration closed when the consent request fails", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    getSubscriptionConsent.mockRejectedValue(new Error("network"));
    renderPlan();
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save registration" })).toBeDisabled();
    expect(registerSubscription).not.toHaveBeenCalled();
  });

  it("does not treat draft or inactive wording as approval", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    getSubscriptionConsent.mockResolvedValue({
      available: false,
      version: "draft-hidden",
      text: "Draft wording that must not be shown.",
      publishedAt: null,
    });
    renderPlan();
    expect(await screen.findByText(/approved agreement is published/)).toBeInTheDocument();
    expect(screen.queryByText("Draft wording that must not be shown.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save registration" })).toBeDisabled();
    expect(registerSubscription).not.toHaveBeenCalled();
  });

  it("refreshes a replaced agreement and requires a new acceptance", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    listCustomerAddresses.mockResolvedValue([
      { id: "addr-1", address1: "1 Rose Street", city: "Dubai", country: "AE" },
    ]);
    getSubscriptionConsent
      .mockResolvedValueOnce({
        available: true,
        version: "market-live-1",
        text: "First published wording.",
        publishedAt: "2026-10-20T09:00:00.000Z",
      })
      .mockResolvedValue({
        available: true,
        version: "market-live-2",
        text: "Replacement published wording.",
        publishedAt: "2026-10-20T10:00:00.000Z",
      });
    registerSubscription.mockRejectedValue(
      new ApiClientError(422, { code: "SUB_CONSENT_STALE", message: "That consent version is no longer active" }),
    );
    renderPlan();
    expect(await screen.findByText("First published wording.")).toBeInTheDocument();
    await chooseAudience("Women");
    fireEvent.click(screen.getByRole("button", { name: "Surprise Me" }));
    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "addr-1" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save registration" }));
    expect(await screen.findByText("Replacement published wording.")).toBeInTheDocument();
    expect(screen.queryByText("First published wording.")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Save registration" })).toBeDisabled();
    expect(registerSubscription).toHaveBeenCalledTimes(1);
    expect(registerSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ consentTextVersion: "market-live-1", audience: "WOMEN", mode: "SURPRISE" }),
      expect.any(String),
    );
  });

  it("does not reuse acceptance after the market changes", async () => {
    useUiStore.getState().selectMarket("UAE", {
      zoneCode: "UAE",
      brandCode: "SWISS_ARABIAN",
    });
    signIn();
    listCustomerAddresses.mockResolvedValue([
      { id: "addr-1", address1: "1 Rose Street", city: "Dubai", country: "AE" },
    ]);
    getSubscriptionConsent.mockImplementation(async (zone: string) => {
      const brand = useUiStore.getState().catalogContext?.brandCode;
      if (brand === "SAPIL") {
        return {
          available: true,
          version: "sapil-live-1",
          text: "SAPIL published wording.",
          publishedAt: "2026-10-20T09:00:00.000Z",
        };
      }
      return {
        available: true,
        version: zone === "UAE" ? "uae-live-1" : "other-live-1",
        text: zone === "UAE" ? "Swiss Arabian UAE wording." : "Other market wording.",
        publishedAt: "2026-10-20T09:00:00.000Z",
      };
    });
    const view = renderPlan();
    expect(await screen.findByText("Swiss Arabian UAE wording.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    await act(async () => {
      useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SAPIL" });
    });
    view.rerender(
      <QueryClientProvider client={view.client}>
        <PlanSelectionPageView planCode="MONTHLY_65" />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("SAPIL published wording.")).toBeInTheDocument();
    expect(screen.queryByText("Swiss Arabian UAE wording.")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(registerSubscription).not.toHaveBeenCalled();
  });

  it("reuses the idempotency key when the same registration is retried", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    listCustomerAddresses.mockResolvedValue([
      { id: "addr-1", address1: "1 Rose Street", city: "Dubai", country: "AE" },
    ]);
    getSubscriptionConsent.mockResolvedValue({
      available: true,
      version: "market-live-1",
      text: "Exact published wording.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    });
    registerSubscription
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        id: "sub-new",
        amount: "65.00",
        currencyCode: "AED",
        selectionMode: "SURPRISE",
        status: "PENDING_ACTIVATION",
        billingEnabled: false,
        nextBillingAt: null,
      });
    renderPlan();
    expect(await screen.findByText("Exact published wording.")).toBeInTheDocument();
    await chooseAudience("Men");
    fireEvent.click(screen.getByRole("button", { name: "Surprise Me" }));
    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "addr-1" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save registration" }));
    expect(await screen.findByText("network")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save registration" }));
    await waitFor(() => expect(registerSubscription).toHaveBeenCalledTimes(2));
    const firstKey = registerSubscription.mock.calls[0]?.[1];
    const secondKey = registerSubscription.mock.calls[1]?.[1];
    expect(firstKey).toBe(secondKey);
    expect(await screen.findByText("Status: Pending activation.")).toBeInTheDocument();
  });

  it("saves a reordered queue and asks before cancelling", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE" });
    getMySubscription.mockResolvedValue({
      id: "sub-1",
      planId: "plan",
      planCode: "MONTHLY_65",
      planVersionId: "ver",
      versionNumber: 1,
      amount: "65.00",
      currencyCode: "AED",
      intervalUnit: "MONTH",
      intervalCount: 1,
      selectionMode: "QUEUE",
      status: "PENDING_ACTIVATION",
      billingEnabled: false,
      nextBillingAt: null,
      registeredAt: "2026-10-19T00:00:00.000Z",
      planStatus: "PUBLISHED",
      audience: "MEN",
      billable: false,
      queue: [
        { variantId: "b", sku: "B", position: 1, quantity: 1 },
        { variantId: "a", sku: "A", position: 2, quantity: 1 },
      ],
      consent: null,
      provisionalPreview: null,
    });
    listPlanProducts.mockResolvedValue([
      { variantId: "a", productId: "p", sku: "A", name: "Alpha" },
      { variantId: "b", productId: "p", sku: "B", name: "Beta" },
    ]);
    replaceSubscriptionQueue.mockResolvedValue({ selectionMode: "QUEUE", provisional: true, allocated: false, items: [] });
    changeSelectionMode.mockResolvedValue({});
    cancelSubscription.mockResolvedValue({});
    renderWith(<AccountSubscriptionDetailPageView id="sub-1" />);
    expect(await screen.findByText("Pending activation")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Up" })[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Save queue" }));
    await waitFor(() => expect(replaceSubscriptionQueue).toHaveBeenCalledWith("sub-1", "UAE", ["a", "b"]));
    fireEvent.click(screen.getByRole("button", { name: "Switch to Surprise Me" }));
    await waitFor(() => expect(changeSelectionMode).toHaveBeenCalledWith("sub-1", "UAE", "SURPRISE"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel agreement" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    await waitFor(() => expect(cancelSubscription).toHaveBeenCalledWith("sub-1", "UAE"));
    expect(screen.queryByText(/next charge/i)).not.toBeInTheDocument();
  });

  it("restores the audience saved before login", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE" });
    sessionStorage.setItem(
      "sa-sub-draft:MONTHLY_65",
      JSON.stringify({ mode: "QUEUE", selected: ["v-high"], audience: "WOMEN" }),
    );
    getSubscriptionPlan.mockResolvedValue(publishedPlan);
    listPlanProducts.mockResolvedValue([
      { variantId: "v-high", productId: "p", sku: "HIGH", name: "Costly rose" },
    ]);
    renderWith(<PlanSelectionPageView planCode="MONTHLY_65" />);
    expect(await screen.findByRole("button", { name: "Women" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(listPlanProducts).toHaveBeenCalledWith("MONTHLY_65", "UAE", "WOMEN"));
    expect(screen.getAllByText("Costly rose").length).toBeGreaterThan(0);
  });

  it("blocks surprise registration when no schedule is published", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", brandCode: "SWISS_ARABIAN" });
    signIn();
    listCustomerAddresses.mockResolvedValue([
      { id: "addr-1", address1: "1 Rose Street", city: "Dubai", country: "AE" },
    ]);
    getSubscriptionConsent.mockResolvedValue({
      available: true,
      version: "market-live-1",
      text: "Exact published wording.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    });
    registerSubscription.mockRejectedValue(
      new ApiClientError(422, {
        code: "SUB_SCHEDULE_UNAVAILABLE",
        message: "No published Surprise schedule is available for this audience.",
      }),
    );
    renderPlan();
    expect(await screen.findByText("Exact published wording.")).toBeInTheDocument();
    await chooseAudience("Women");
    fireEvent.click(screen.getByRole("button", { name: "Surprise Me" }));
    fireEvent.change(screen.getByLabelText("Delivery address"), { target: { value: "addr-1" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save registration" }));
    expect(await screen.findByText(/No published Surprise schedule is available/)).toBeInTheDocument();
    expect(registerSubscription.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ mode: "SURPRISE", audience: "WOMEN" }),
    );
    expect(registerSubscription.mock.calls[0]?.[0]).not.toHaveProperty("variantIds");
    expect(listPlanProducts).not.toHaveBeenCalledWith("MONTHLY_65", "UAE", undefined);
  });

  it("renders a legacy agreement without an audience or pinned schedule", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE" });
    getMySubscription.mockResolvedValue({
      id: "legacy",
      planId: "plan",
      planCode: "MONTHLY_65",
      planVersionId: "ver",
      versionNumber: 1,
      amount: "65.00",
      currencyCode: "AED",
      intervalUnit: "MONTH",
      intervalCount: 1,
      selectionMode: "SURPRISE",
      audience: null,
      status: "PENDING_ACTIVATION",
      billingEnabled: false,
      nextBillingAt: null,
      registeredAt: "2026-10-19T00:00:00.000Z",
      planStatus: "PUBLISHED",
      billable: false,
      queue: [],
      consent: null,
      surpriseSchedule: null,
      provisionalPreview: {
        provisional: true,
        allocated: false,
        source: "PROVISIONAL_POOL",
        variant: { variantId: "pool", productId: "p", sku: "POOL", name: "Hidden pool rose" },
      },
    });
    renderWith(<AccountSubscriptionDetailPageView id="legacy" />);
    expect(await screen.findByText("No audience is saved on this agreement.")).toBeInTheDocument();
    expect(screen.getByText(/No published schedule is pinned/)).toBeInTheDocument();
    expect(screen.queryByText("Hidden pool rose")).not.toBeInTheDocument();
    expect(screen.queryByText("POOL")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Switch to Surprise Me" })).not.toBeInTheDocument();
    expect(screen.queryByText(/shipment is on the way/i)).not.toBeInTheDocument();
  });
});
