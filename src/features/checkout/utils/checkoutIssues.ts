import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import type { CheckoutValidationIssue } from "../types/checkout";

/**
 * Checkout validation issues (`issueType`, then `code`) the shop words for
 * shoppers: `checkout.issue.<TYPE>` in the message files. Guide §4.8 types
 * first, then codes the reference observed live. Anything else is internal.
 */
const ISSUE_TYPES = new Set([
  "ITEM_NOT_SELLABLE",
  "ITEM_PRICE_MISSING",
  "ITEM_INSUFFICIENT_INVENTORY",
  "ITEM_PRICE_CHANGED",
  "ADDRESS_MISSING",
  "DELIVERY_METHOD_MISSING",
  "PAYMENT_METHOD_MISSING",
  "PRICE_MISSING",
  "PRODUCT_NOT_SELLABLE",
  "PRODUCT_NOT_VISIBLE",
  "INSUFFICIENT_INVENTORY",
  "INVENTORY_MISSING",
  "VARIANT_INACTIVE",
  "CURRENCY_MISMATCH",
  "ADDRESS_INVALID",
  "PAYMENT_METHOD_UNAVAILABLE",
  "DELIVERY_METHOD_UNAVAILABLE",
  "MANUAL_REVIEW_REQUIRED",
]);

function isError(issue: CheckoutValidationIssue): boolean {
  return (issue.severity ?? "").toUpperCase() === "ERROR";
}

function issueKey(issue: CheckoutValidationIssue): MessageKey | null {
  const type = [issue.issueType, issue.code].find((value) => value && ISSUE_TYPES.has(value));
  return type ? (`checkout.issue.${type}` as MessageKey) : null;
}

function issueCopy(issue: CheckoutValidationIssue, t: Translator): string {
  const key = issueKey(issue);
  return key ? t(key) : t("checkout.err.blocked");
}

/** The one message to show when validation blocks placement. */
export function checkoutIssueMessage(
  issues: CheckoutValidationIssue[] | undefined,
  t: Translator = pageTranslator(),
): string {
  const list = issues ?? [];
  const blocking = list.find(isError) ?? list[0];
  return blocking ? issueCopy(blocking, t) : t("checkout.err.blocked");
}

/** Non-blocking notices (e.g. price changed) — shown, but checkout proceeds. */
export function checkoutWarningMessages(
  issues: CheckoutValidationIssue[] | undefined,
  t: Translator = pageTranslator(),
): string[] {
  // Only warnings written for shoppers. Internal notices (e.g. the D365
  // customer mapping, which only affects back-office posting) never show.
  const warnings = (issues ?? []).filter(
    (i) => (i.severity ?? "").toUpperCase() === "WARNING" && issueKey(i) !== null,
  );
  return [...new Set(warnings.map((issue) => issueCopy(issue, t)))];
}

/** A failed checkout call, as the shopper reads it (the shop's one error rule). */
export function checkoutErrorMessage(error: unknown, fallback?: string | null): string {
  return getUserFacingErrorMessage(error, fallback);
}
