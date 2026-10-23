import type { SetupSessionBody } from "../api/paymentInstrument.api";

export type CardSetupPhase =
  | "validation_error"
  | "declined"
  | "authentication_required"
  | "processing"
  | "webhook_pending";

const SETUP_INTENT_ID = /^(seti_[A-Za-z0-9]+)_secret_/;

export function buildSetupSessionBody(input: {
  zoneCode: string;
  consentTextVersion: string;
  recurringUseAccepted: boolean;
}): SetupSessionBody | null {
  const zoneCode = input.zoneCode.trim();
  const consentTextVersion = input.consentTextVersion.trim();
  if (input.recurringUseAccepted !== true || !zoneCode || !consentTextVersion) return null;
  return { zoneCode, recurringUseAccepted: true, consentTextVersion };
}

/** Only a Stripe test publishable key may open the card form. */
export function selectTestPublishableKey(key: string | null | undefined): string | null {
  const value = key?.trim() ?? "";
  if (!value.startsWith("pk_test_")) return null;
  return value;
}

export function setupIntentIdFromClientSecret(secret: string): string | null {
  return SETUP_INTENT_ID.exec(secret)?.[1] ?? null;
}

export function classifySetupConfirmation(result: {
  error?: { type?: string; code?: string } | null;
  setupIntent?: { status?: string } | null;
}): CardSetupPhase {
  const code = result.error?.code ?? "";
  if (
    code === "setup_intent_authentication_failure" ||
    code === "payment_intent_authentication_failure" ||
    result.setupIntent?.status === "requires_action"
  ) {
    return "authentication_required";
  }
  if (result.error?.type === "validation_error") return "validation_error";
  if (result.error) return "declined";
  if (result.setupIntent?.status === "processing") return "processing";
  if (result.setupIntent?.status === "succeeded") return "webhook_pending";
  return "declined";
}

export function instrumentActivation(items: { id: string; status: string }[], instrumentId: string): "ACTIVE" | "PENDING" {
  const row = items.find((item) => item.id === instrumentId);
  return row?.status === "ACTIVE" ? "ACTIVE" : "PENDING";
}

export function setupReturnPhase(search: string): CardSetupPhase | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!params.get("setup_intent")) return null;
  const status = params.get("redirect_status");
  if (status === "succeeded") return "webhook_pending";
  if (status === "processing") return "processing";
  if (status === "requires_action") return "authentication_required";
  return "declined";
}

export const CARD_SETUP_COPY: Record<CardSetupPhase | "active" | "unavailable", string> = {
  validation_error: "Check the card details and try again. Nothing was charged.",
  declined: "The card could not be saved. Nothing was charged.",
  authentication_required: "Your bank needs to confirm this card. Complete that prompt. The card stays pending until it succeeds.",
  processing: "The bank is still processing this card. Nothing is charged, and the card is not active yet.",
  webhook_pending: "The card was submitted. It stays pending until confirmation arrives. This page does not mark it active.",
  active: "The saved card is active. The subscription payment has not been started.",
  unavailable: "Card setup is unavailable for this market.",
};
