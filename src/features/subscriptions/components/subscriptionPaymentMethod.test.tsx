import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api/apiError";
import { SubscriptionPaymentMethodSection } from "./SubscriptionPaymentMethodSection";
import {
  confirmSubscriptionPaymentMethod,
  startSubscriptionPaymentMethod,
} from "../api/subscription.api";

const apiPost = vi.hoisted(() => vi.fn());
const confirmSetup = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: vi.fn(),
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiPut: vi.fn(),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: (key: string) => Promise.resolve({ publishableKey: key }),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div>Card element</div>,
  useStripe: () => ({ confirmSetup }),
  useElements: () => ({}),
}));

const current = {
  brand: "visa",
  last4: "4242",
  expiryMonth: 12,
  expiryYear: 2030,
  status: "ACTIVE",
};

const consent = { version: "s6b4-e765649c", text: "Published recurring card agreement." };

function renderCard(overrides: Partial<ComponentProps<typeof SubscriptionPaymentMethodSection>> = {}) {
  const onSaved = vi.fn(async () => undefined);
  render(
    <SubscriptionPaymentMethodSection
      subscriptionId="sub-a"
      zoneCode="UAE"
      paymentMethod={current}
      canReplace
      consent={consent}
      returnPath="/account/subscription/sub-a"
      onSaved={onSaved}
      {...overrides}
    />,
  );
  return { onSaved };
}

async function openReplacement() {
  fireEvent.click(screen.getByRole("button", { name: "Change Payment Method" }));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Continue to card" }));
  expect(await screen.findByText("Card element")).toBeInTheDocument();
}

describe("subscription payment method replacement", () => {
  beforeEach(() => {
    apiPost.mockReset();
    confirmSetup.mockReset();
    apiPost.mockResolvedValue({ instrumentId: "inst-new", clientSecret: "seti_new_secret_abc", publishableKey: "pk_test_uae" });
    confirmSetup.mockResolvedValue({ setupIntent: { status: "succeeded" } });
  });

  it("shows the masked card and hides replacement when the backend does not allow it", () => {
    renderCard({ canReplace: false });
    expect(screen.getByText(/visa · •••• 4242 · Expires 12\/2030 · Active/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change Payment Method" })).not.toBeInTheDocument();
    expect(screen.queryByText("4242424242424242")).not.toBeInTheDocument();
    expect(screen.queryByText(/pm_|inst-/)).not.toBeInTheDocument();
  });

  it("confirms the SetupIntent and sends only the backend instrument id", async () => {
    const { onSaved } = renderCard();
    await openReplacement();
    expect(apiPost).toHaveBeenCalledWith("/storefront/subscriptions/sub-a/payment-method/setup", {
      zoneCode: "UAE",
      recurringUseAccepted: true,
      consentTextVersion: "s6b4-e765649c",
    });
    fireEvent.click(screen.getByRole("button", { name: "Save replacement card" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(confirmSetup).toHaveBeenCalledWith(expect.objectContaining({
      clientSecret: "seti_new_secret_abc",
      redirect: "if_required",
    }));
    expect(apiPost).toHaveBeenLastCalledWith("/storefront/subscriptions/sub-a/payment-method/confirm", {
      zoneCode: "UAE",
      instrumentId: "inst-new",
    });
    expect(JSON.stringify(apiPost.mock.calls)).not.toMatch(/payment-intents|payment_intents|\/checkout|charge|set-default/);
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
  });

  it("keeps the previous card when verification or a renewal charge blocks replacement", async () => {
    apiPost.mockImplementation(async (path: string) => {
      if (String(path).endsWith("/confirm")) {
        throw new ApiClientError(422, { code: "SUB_PAYMENT_METHOD_UNVERIFIED", message: "The card setup was not verified." });
      }
      return { instrumentId: "inst-new", clientSecret: "seti_new_secret_abc", publishableKey: "pk_test_uae" };
    });
    const { onSaved } = renderCard();
    await openReplacement();
    fireEvent.click(screen.getByRole("button", { name: "Save replacement card" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The card setup was not verified.");
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();

    apiPost.mockImplementation(async (path: string) => {
      if (String(path).endsWith("/confirm")) {
        throw new ApiClientError(409, {
          code: "SUB_PAYMENT_METHOD_RENEWAL_PENDING",
          message: "A renewal charge is already in progress for this subscription.",
        });
      }
      return { instrumentId: "inst-new", clientSecret: "seti_new_secret_abc", publishableKey: "pk_test_uae" };
    });
    fireEvent.click(screen.getByRole("button", { name: "Save replacement card" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A renewal charge is already in progress");
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
  });

  it("does not confirm a card when Stripe authentication is cancelled", async () => {
    confirmSetup.mockResolvedValue({ error: { code: "setup_intent_authentication_failure", type: "invalid_request_error" } });
    const { onSaved } = renderCard();
    await openReplacement();
    fireEvent.click(screen.getByRole("button", { name: "Save replacement card" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/bank needs to confirm/i);
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
  });

  it("updates only the subscription whose card form was submitted", async () => {
    const savedA = vi.fn(async () => undefined);
    const savedB = vi.fn(async () => undefined);
    render(
      <>
        <SubscriptionPaymentMethodSection
          subscriptionId="sub-a"
          zoneCode="UAE"
          paymentMethod={current}
          canReplace
          consent={consent}
          returnPath="/account/subscription/sub-a"
          onSaved={savedA}
        />
        <SubscriptionPaymentMethodSection
          subscriptionId="sub-b"
          zoneCode="UAE"
          paymentMethod={{ ...current, last4: "1111" }}
          canReplace
          consent={consent}
          returnPath="/account/subscription/sub-b"
          onSaved={savedB}
        />
      </>,
    );
    const changeButtons = screen.getAllByRole("button", { name: "Change Payment Method" });
    fireEvent.click(changeButtons[0]!);
    fireEvent.click(screen.getAllByRole("checkbox")[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Continue to card" })[0]!);
    expect(await screen.findByText("Card element")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save replacement card" }));
    await waitFor(() => expect(savedA).toHaveBeenCalledTimes(1));
    expect(savedB).not.toHaveBeenCalled();
    expect(apiPost.mock.calls.every((call) => String(call[0]).includes("sub-a"))).toBe(true);
    expect(JSON.stringify(apiPost.mock.calls)).not.toContain("sub-b");
    expect(screen.getByText(/•••• 1111/)).toBeInTheDocument();
  });

  it("posts setup and confirm for the subscription id it is given", async () => {
    await startSubscriptionPaymentMethod("sub-b", {
      zoneCode: "UAE",
      recurringUseAccepted: true,
      consentTextVersion: "s6b4-e765649c",
    });
    await confirmSubscriptionPaymentMethod("sub-b", { zoneCode: "UAE", instrumentId: "inst-b" });
    expect(apiPost).toHaveBeenNthCalledWith(1, "/storefront/subscriptions/sub-b/payment-method/setup", {
      zoneCode: "UAE",
      recurringUseAccepted: true,
      consentTextVersion: "s6b4-e765649c",
    });
    expect(apiPost).toHaveBeenNthCalledWith(2, "/storefront/subscriptions/sub-b/payment-method/confirm", {
      zoneCode: "UAE",
      instrumentId: "inst-b",
    });
  });
});
