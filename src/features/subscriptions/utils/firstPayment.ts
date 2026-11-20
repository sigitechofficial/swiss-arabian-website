import { englishTranslator, type Translator } from "@/lib/i18n/messages";
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

export function firstPaymentMessage(
  view: Pick<FirstPaymentSnapshot, "status" | "cycle">,
  t: Translator = englishTranslator,
): string {
  if (subscriptionActivated(view)) return t("subs.firstPayment.activated");
  switch (view.cycle.outcome) {
    case "PROCESSING":
      return t("subs.firstPayment.processing");
    case "REQUIRES_CUSTOMER_ACTION":
      return t("subs.firstPayment.actionRequired");
    case "FAILED":
      return t("subs.firstPayment.failed");
    case "RECONCILIATION_REQUIRED":
      return t("subs.firstPayment.needsSupport");
    default:
      return t("subs.firstPayment.cardReady");
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
