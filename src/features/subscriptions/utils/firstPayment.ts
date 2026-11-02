import type { FirstPaymentBody, FirstPaymentOutcome, FirstPaymentSnapshot } from "../api/subscription.api";

export function firstPaymentBody(zoneCode: string, paymentInstrumentId: string): FirstPaymentBody {
  return { zoneCode, paymentInstrumentId };
}

export function shouldPostFirstPayment(outcome: FirstPaymentOutcome): boolean {
  return outcome === "NOT_STARTED";
}

export function subscriptionActivated(view: Pick<FirstPaymentSnapshot, "status" | "cycle">): boolean {
  return view.status === "ACTIVE" && view.cycle.outcome === "SUCCESS";
}

export function reusableInstrument(
  items: { id: string; status: string; createdAt?: string }[],
  preferredId?: string | null,
): string | null {
  if (preferredId && items.some((item) => item.id === preferredId && item.status === "ACTIVE")) {
    return preferredId;
  }
  const active = items
    .filter((item) => item.status === "ACTIVE")
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
  return active[0]?.id ?? null;
}

export function firstPaymentMessage(view: Pick<FirstPaymentSnapshot, "status" | "cycle">): string {
  if (subscriptionActivated(view)) {
    return "Subscription activated. The first payment is confirmed. Fulfillment is still pending, and no order has been placed.";
  }
  switch (view.cycle.outcome) {
    case "PROCESSING":
      return "The payment is processing. This page will not start another charge.";
    case "REQUIRES_CUSTOMER_ACTION":
      return "Your bank needs to confirm this payment. The subscription stays inactive until that payment is confirmed.";
    case "FAILED":
      return "The payment did not succeed. No new charge was started.";
    case "RECONCILIATION_REQUIRED":
      return "This payment needs support to finish. No new charge was started.";
    default:
      return "The saved card is ready. The subscription payment has not been confirmed.";
  }
}

export async function settleFirstPayment(input: {
  subscriptionId: string;
  zoneCode: string;
  paymentInstrumentId: string;
  read: (id: string, zoneCode: string) => Promise<FirstPaymentSnapshot>;
  start: (id: string, body: FirstPaymentBody) => Promise<FirstPaymentSnapshot>;
  confirmAction?: (clientSecret: string) => Promise<void>;
  wait?: (ms: number) => Promise<void>;
}): Promise<FirstPaymentSnapshot> {
  let view = await input.read(input.subscriptionId, input.zoneCode);
  if (shouldPostFirstPayment(view.cycle.outcome)) {
    view = await input.start(
      input.subscriptionId,
      firstPaymentBody(input.zoneCode, input.paymentInstrumentId),
    );
  }
  if (view.cycle.outcome === "REQUIRES_CUSTOMER_ACTION" && view.clientSecret && input.confirmAction) {
    await input.confirmAction(view.clientSecret);
    view = await input.read(input.subscriptionId, input.zoneCode);
  }
  const wait = input.wait ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let polls = 0;
  while (view.cycle.outcome === "PROCESSING" && polls < 3) {
    await wait(800);
    view = await input.read(input.subscriptionId, input.zoneCode);
    polls += 1;
  }
  return view;
}
