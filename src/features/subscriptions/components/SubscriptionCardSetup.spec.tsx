import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createSetupSession = vi.hoisted(() => vi.fn());
const listPaymentInstruments = vi.hoisted(() => vi.fn());
const confirmSetup = vi.hoisted(() => vi.fn());
const confirmCardPayment = vi.hoisted(() => vi.fn());
const readFirstPayment = vi.hoisted(() => vi.fn());
const startFirstPayment = vi.hoisted(() => vi.fn());

vi.mock("../api/paymentInstrument.api", () => ({
  createSetupSession: (...args: unknown[]) => createSetupSession(...args),
  listPaymentInstruments: (...args: unknown[]) => listPaymentInstruments(...args),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: (key: string) => Promise.resolve({ publishableKey: key, confirmCardPayment }),
}));

vi.mock("../api/subscription.api", () => ({
  readFirstPayment: (...args: unknown[]) => readFirstPayment(...args),
  startFirstPayment: (...args: unknown[]) => startFirstPayment(...args),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div>Card element</div>,
  useStripe: () => ({ confirmSetup }),
  useElements: () => ({}),
}));

import { SubscriptionCardSetup } from "./SubscriptionCardSetup";

const secret = "seti_test123_secret_abc";

function renderSetup() {
  return render(
    <SubscriptionCardSetup
      zoneCode="UAE"
      consentVersion="s6b4-e765649c"
      consentText="Published agreement text."
      returnPath="/account/subscription/sub-1"
    />,
  );
}

async function continueToCard() {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Continue to card" }));
}

async function openCard() {
  await continueToCard();
  expect(await screen.findByText("Card element")).toBeInTheDocument();
}

describe("subscription card authorization", () => {
  beforeEach(() => {
    createSetupSession.mockReset();
    listPaymentInstruments.mockReset();
    confirmSetup.mockReset();
    sessionStorage.clear();
    createSetupSession.mockResolvedValue({
      instrumentId: "inst-1",
      status: "PENDING_SETUP",
      providerCode: "stripe",
      clientSecret: secret,
      publishableKey: "pk_test_uae",
    });
  });

  it("requires recurring consent before the setup-session call", async () => {
    renderSetup();
    expect(screen.getByRole("button", { name: "Continue to card" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Continue to card" }));
    expect(createSetupSession).not.toHaveBeenCalled();
    await openCard();
    expect(createSetupSession).toHaveBeenCalledWith({
      zoneCode: "UAE",
      recurringUseAccepted: true,
      consentTextVersion: "s6b4-e765649c",
    });
    expect(JSON.stringify(createSetupSession.mock.calls)).not.toMatch(/first-payment/);
  });

  it("refuses a live publishable key before Stripe confirmation", async () => {
    createSetupSession.mockResolvedValue({
      instrumentId: "inst-1",
      status: "PENDING_SETUP",
      providerCode: "stripe",
      clientSecret: secret,
      publishableKey: "pk_live_uae",
    });
    renderSetup();
    await continueToCard();
    expect(await screen.findByText("Card setup is unavailable for this market.")).toBeInTheDocument();
    expect(confirmSetup).not.toHaveBeenCalled();
  });

  it("keeps a succeeded confirmation pending until the instrument read is ACTIVE", async () => {
    confirmSetup.mockResolvedValue({ setupIntent: { status: "succeeded" } });
    listPaymentInstruments.mockResolvedValue([{ id: "inst-1", status: "PENDING_SETUP" }]);
    renderSetup();
    await openCard();
    fireEvent.click(screen.getByRole("button", { name: "Save card" }));
    expect(await screen.findByText(/does not mark it active/i)).toBeInTheDocument();
    expect(confirmSetup).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: secret,
        redirect: "if_required",
        confirmParams: { return_url: `${window.location.origin}/account/subscription/sub-1` },
      }),
    );
    expect(JSON.stringify(confirmSetup.mock.calls)).not.toMatch(/first-payment/);
  });

  it("shows bank authentication instead of a local active card", async () => {
    confirmSetup.mockResolvedValue({ error: { code: "setup_intent_authentication_failure", type: "invalid_request_error" } });
    renderSetup();
    await openCard();
    fireEvent.click(screen.getByRole("button", { name: "Save card" }));
    expect(await screen.findByText(/bank needs to confirm/i)).toBeInTheDocument();
    expect(listPaymentInstruments).not.toHaveBeenCalled();
  });

  it("shows the card as active only after the instrument list says ACTIVE", async () => {
    confirmSetup.mockResolvedValue({ setupIntent: { status: "succeeded" } });
    listPaymentInstruments.mockResolvedValue([{ id: "inst-1", status: "ACTIVE" }]);
    renderSetup();
    await openCard();
    fireEvent.click(screen.getByRole("button", { name: "Save card" }));
    expect(await screen.findByText(/saved card is active/i)).toBeInTheDocument();
    expect(screen.getByText(/payment has not been started/i)).toBeInTheDocument();
    expect(startFirstPayment).not.toHaveBeenCalled();
  });

  it("starts the first payment once after the saved card is active", async () => {
    listPaymentInstruments.mockResolvedValue([{ id: "inst-1", status: "ACTIVE", createdAt: "2026-10-22T00:00:00.000Z" }]);
    readFirstPayment.mockResolvedValueOnce({
      status: "PENDING_ACTIVATION",
      cycle: { outcome: "NOT_STARTED" },
      clientSecret: null,
    });
    startFirstPayment.mockResolvedValue({
      status: "ACTIVE",
      cycle: { outcome: "SUCCESS" },
      clientSecret: null,
    });
    render(
      <SubscriptionCardSetup
        zoneCode="UAE"
        consentVersion="s6b4-e765649c"
        consentText="Published agreement text."
        returnPath="/subscriptions/PLAN"
        subscriptionId="sub-1"
      />,
    );
    expect(await screen.findByText(/Subscription activated/i)).toBeInTheDocument();
    expect(screen.getByText(/no order has been placed/i)).toBeInTheDocument();
    expect(startFirstPayment).toHaveBeenCalledTimes(1);
    expect(startFirstPayment).toHaveBeenCalledWith("sub-1", {
      zoneCode: "UAE",
      paymentInstrumentId: "inst-1",
    });
    expect(screen.queryByRole("button", { name: "Continue to card" })).not.toBeInTheDocument();
    expect(startFirstPayment).toHaveBeenCalledTimes(1);
  });
});
