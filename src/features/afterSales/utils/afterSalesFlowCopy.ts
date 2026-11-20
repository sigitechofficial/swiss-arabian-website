import type { MessageKey, Translator } from "@/lib/i18n/messages";
import type { ExchangeOption } from "../types/afterSales";
import type { FlowStep } from "./afterSalesFlow";

/** Copy for the guided return / exchange, shared by every brand's screens. */

const STEP_KEY: Record<FlowStep, MessageKey> = {
  choose: "afterSales.flow.step.choose",
  items: "afterSales.flow.step.items",
  reason: "afterSales.flow.step.reason",
  replacement: "afterSales.flow.step.replacement",
  review: "afterSales.flow.step.review",
};

export function flowStepKey(step: FlowStep): MessageKey {
  return STEP_KEY[step];
}

/** Why a line cannot be picked, in the shopper's words. */
export function flowBlockedKey(reason: string | undefined): MessageKey {
  if (reason === "QTY_EXCEEDED") return "afterSales.flow.blocked.taken";
  if (reason === "NON_RETURNABLE_SKU" || reason === "NON_RETURNABLE_CATEGORY") return "afterSales.flow.blocked.notReturnable";
  return "afterSales.flow.blocked.other";
}

/** What one unit of a replacement adds or gives back ("Same price", "+ AED 42 each", "AED 42 back each"). */
export function unitDifferenceText(
  option: Pick<ExchangeOption, "unitDifference">,
  t: Translator,
  money: (amount: string) => string,
): string {
  const difference = option.unitDifference;
  if (!difference) return t("afterSales.flow.replacement.noPrice");
  if (difference.direction === "CUSTOMER_OWES") return t("afterSales.flow.replacement.pay", { amount: money(difference.amount) });
  if (difference.direction === "REFUND_DUE") return t("afterSales.flow.replacement.back", { amount: money(difference.amount) });
  return t("afterSales.flow.replacement.samePrice");
}
