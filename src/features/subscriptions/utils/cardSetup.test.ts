import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

import { createSetupSession, listPaymentInstruments } from "../api/paymentInstrument.api";
import {
  buildSetupSessionBody,
  classifySetupConfirmation,
  instrumentActivation,
  selectTestPublishableKey,
  setupReturnPhase,
} from "./cardSetup";

describe("saved-card setup", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
  });

  it("sends the existing setup-session contract and reads instruments back", async () => {
    const body = buildSetupSessionBody({
      zoneCode: "UAE",
      consentTextVersion: "s6b4-e765649c",
      recurringUseAccepted: true,
    });
    expect(body).toEqual({
      zoneCode: "UAE",
      recurringUseAccepted: true,
      consentTextVersion: "s6b4-e765649c",
    });
    expect(buildSetupSessionBody({ ...body!, recurringUseAccepted: false })).toBeNull();

    apiPost.mockResolvedValue({ instrumentId: "inst-1", status: "PENDING_SETUP" });
    await createSetupSession(body!);
    expect(apiPost).toHaveBeenCalledWith("/storefront/payment-instruments/setup-session", body);
    expect(JSON.stringify(apiPost.mock.calls)).not.toMatch(/first-payment/);

    apiGet.mockResolvedValue({ items: [{ id: "inst-1", status: "ACTIVE" }] });
    await expect(listPaymentInstruments("UAE")).resolves.toEqual([{ id: "inst-1", status: "ACTIVE" }]);
    expect(apiGet).toHaveBeenCalledWith("/storefront/payment-instruments?zoneCode=UAE");
  });

  it("accepts only a test publishable key", () => {
    expect(selectTestPublishableKey("pk_test_uae")).toBe("pk_test_uae");
    expect(selectTestPublishableKey("pk_live_uae")).toBeNull();
    expect(selectTestPublishableKey("")).toBeNull();
    expect(selectTestPublishableKey(null)).toBeNull();
  });

  it("classifies confirmation, authentication, and webhook-pending results", () => {
    expect(classifySetupConfirmation({ error: { type: "validation_error" } })).toBe("validation_error");
    expect(classifySetupConfirmation({ error: { type: "card_error", code: "card_declined" } })).toBe("declined");
    expect(
      classifySetupConfirmation({ error: { code: "setup_intent_authentication_failure" } }),
    ).toBe("authentication_required");
    expect(classifySetupConfirmation({ setupIntent: { status: "requires_action" } })).toBe("authentication_required");
    expect(classifySetupConfirmation({ setupIntent: { status: "processing" } })).toBe("processing");
    expect(classifySetupConfirmation({ setupIntent: { status: "succeeded" } })).toBe("webhook_pending");
    expect(setupReturnPhase("?setup_intent=seti_1&redirect_status=succeeded")).toBe("webhook_pending");
  });

  it("treats ACTIVE as webhook-confirmed and leaves every other status pending", () => {
    expect(instrumentActivation([{ id: "inst-1", status: "PENDING_SETUP" }], "inst-1")).toBe("PENDING");
    expect(instrumentActivation([{ id: "inst-1", status: "ACTIVE" }], "inst-1")).toBe("ACTIVE");
    expect(instrumentActivation([{ id: "other", status: "ACTIVE" }], "inst-1")).toBe("PENDING");
  });
});
