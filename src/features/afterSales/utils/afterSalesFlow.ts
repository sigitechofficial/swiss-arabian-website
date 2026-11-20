import type {
  AfterSalesEligibilityLine,
  AfterSalesKind,
  CreateExchangeDto,
  CreateReturnDto,
  ExchangeEstimateDto,
  ExchangeOption,
  ExchangeOptionsLine,
  ExchangeType,
  ReturnEstimateDto,
} from "../types/afterSales";
import { afterSalesOptionCodes } from "./eligibility";

/**
 * The guided return / exchange flow, brand-neutral: which steps a request has,
 * when a step is complete, and the request it sends. Screens (Swiss Arabian,
 * Sapil) only draw these.
 */

export type FlowStep = "choose" | "items" | "reason" | "replacement" | "review";

export function flowSteps(kind: AfterSalesKind | null): FlowStep[] {
  if (kind === "exchange") return ["choose", "items", "reason", "replacement", "review"];
  return ["choose", "items", "reason", "review"];
}

/** What the shopper has put together so far. */
export type FlowDraft = {
  kind: AfterSalesKind | null;
  /** Units picked per order line (absent or 0 = not picked). */
  quantities: Record<string, number>;
  reasonCode: string | null;
  reasonText: string;
  /** Exchange: the SKU picked per order line. */
  replacements: Record<string, string>;
  note: string;
};

export const EMPTY_DRAFT: FlowDraft = {
  kind: null,
  quantities: {},
  reasonCode: null,
  reasonText: "",
  replacements: {},
  note: "",
};

/** Lines worth showing: something was bought (fully cancelled lines are left out). */
export function visibleLines(lines: AfterSalesEligibilityLine[]): AfterSalesEligibilityLine[] {
  return lines.filter((line) => line.orderedQty > 0);
}

/** A line the shopper can pick now. */
export function isPickable(line: AfterSalesEligibilityLine): boolean {
  return line.returnableQty > 0 && !line.blockedReason;
}

/** Picked lines with their quantities, in order-line order. */
export function pickedLines(
  draft: FlowDraft,
  lines: AfterSalesEligibilityLine[],
): Array<{ line: AfterSalesEligibilityLine; quantity: number }> {
  return lines
    .filter(isPickable)
    .map((line) => ({ line, quantity: Math.min(draft.quantities[line.orderLineId] ?? 0, line.returnableQty) }))
    .filter((row) => row.quantity > 0);
}

/** Reasons a shopper picks from (no default: they choose one). */
export function reasonCodesFor(kind: AfterSalesKind): string[] {
  return afterSalesOptionCodes(kind === "return" ? "returnReason" : "exchangeReason");
}

/** The options a picked line can be swapped for, and whether it has a single one. */
export function lineOptions(
  options: ExchangeOptionsLine[] | undefined,
  orderLineId: string,
): ExchangeOption[] {
  return options?.find((line) => line.orderLineId === orderLineId)?.options ?? [];
}

/** The option picked for a line, if it is (still) offered and in stock. */
export function pickedOption(
  draft: FlowDraft,
  options: ExchangeOptionsLine[] | undefined,
  orderLineId: string,
): ExchangeOption | null {
  const sku = draft.replacements[orderLineId];
  if (!sku) return null;
  return lineOptions(options, orderLineId).find((option) => option.sku === sku && option.inStock) ?? null;
}

/** Whether a step has everything it asks for, so the shopper may go on. */
export function stepComplete(
  step: FlowStep,
  draft: FlowDraft,
  lines: AfterSalesEligibilityLine[],
  options?: ExchangeOptionsLine[],
): boolean {
  switch (step) {
    case "choose":
      return draft.kind !== null;
    case "items":
      return pickedLines(draft, lines).length > 0;
    case "reason":
      return Boolean(draft.reasonCode);
    case "replacement":
      return pickedLines(draft, lines).every(({ line }) => pickedOption(draft, options, line.orderLineId) !== null);
    case "review":
      return flowSteps(draft.kind)
        .filter((s) => s !== "review")
        .every((s) => stepComplete(s, draft, lines, options));
  }
}

/** Same item for every line, else a different size / variant. */
export function exchangeTypeFor(
  picked: Array<{ line: AfterSalesEligibilityLine }>,
  replacements: Record<string, string>,
): ExchangeType {
  const same = picked.every(
    ({ line }) => (replacements[line.orderLineId] ?? "").toUpperCase() === line.sku.toUpperCase(),
  );
  return same ? "SAME_ITEM" : "DIFFERENT_VARIANT";
}

const trimmed = (value: string) => value.trim() || undefined;

export function returnRequestDto(draft: FlowDraft, lines: AfterSalesEligibilityLine[]): CreateReturnDto {
  return {
    items: pickedLines(draft, lines).map(({ line, quantity }) => ({ orderLineId: line.orderLineId, quantity })),
    reasonCode: draft.reasonCode ?? undefined,
    reasonText: trimmed(draft.reasonText),
    customerNote: trimmed(draft.note),
    // The flow is the refund path; an exchange is its own request.
    requestedResolution: "REFUND",
  };
}

export function exchangeRequestDto(draft: FlowDraft, lines: AfterSalesEligibilityLine[]): CreateExchangeDto {
  const picked = pickedLines(draft, lines);
  return {
    items: picked.map(({ line, quantity }) => ({
      orderLineId: line.orderLineId,
      quantity,
      replacementSku: draft.replacements[line.orderLineId] ?? line.sku,
    })),
    reasonCode: draft.reasonCode ?? undefined,
    reasonText: trimmed(draft.reasonText),
    customerNote: trimmed(draft.note),
    exchangeType: exchangeTypeFor(picked, draft.replacements),
  };
}

/** Refund estimate body once items and a reason are picked; `null` before. */
export function returnEstimateBody(
  draft: FlowDraft,
  lines: AfterSalesEligibilityLine[],
): ReturnEstimateDto | null {
  if (draft.kind !== "return" || !draft.reasonCode) return null;
  const items = pickedLines(draft, lines).map(({ line, quantity }) => ({ orderLineId: line.orderLineId, quantity }));
  return items.length ? { items, reasonCode: draft.reasonCode } : null;
}

/** Exchange estimate body once every picked item has its replacement; `null` before. */
export function exchangeEstimateBody(
  draft: FlowDraft,
  lines: AfterSalesEligibilityLine[],
  options: ExchangeOptionsLine[] | undefined,
): ExchangeEstimateDto | null {
  if (draft.kind !== "exchange" || !stepComplete("replacement", draft, lines, options)) return null;
  const items = pickedLines(draft, lines).map(({ line, quantity }) => ({
    orderLineId: line.orderLineId,
    quantity,
    replacementSku: draft.replacements[line.orderLineId],
  }));
  return items.length ? { items, reasonCode: draft.reasonCode ?? undefined } : null;
}

/**
 * When a line has exactly one thing it can be swapped for (a free gift, a
 * product sold in one size), it is picked for the shopper.
 */
export function withOnlyOptionsPicked(
  draft: FlowDraft,
  lines: AfterSalesEligibilityLine[],
  options: ExchangeOptionsLine[] | undefined,
): FlowDraft {
  let replacements = draft.replacements;
  for (const { line } of pickedLines(draft, lines)) {
    if (replacements[line.orderLineId]) continue;
    const inStock = lineOptions(options, line.orderLineId).filter((option) => option.inStock);
    if (inStock.length === 1) replacements = { ...replacements, [line.orderLineId]: inStock[0].sku };
  }
  return replacements === draft.replacements ? draft : { ...draft, replacements };
}

/** `?type=return|exchange` on the flow page: start with that choice made. */
export function flowKindParam(value: string | null | undefined): AfterSalesKind | null {
  return value === "return" || value === "exchange" ? value : null;
}

/** Where the flow lives for an order (signed-in or guest), optionally with a choice made. */
export function afterSalesFlowHref(
  order: { orderId: string } | { orderNumber: string },
  kind?: AfterSalesKind,
): string {
  const base =
    "orderId" in order
      ? `/account/orders/${encodeURIComponent(order.orderId)}/return`
      : `/track/${encodeURIComponent(order.orderNumber)}/return`;
  return kind ? `${base}?type=${kind}` : base;
}

/**
 * The size / variant worth showing next to a product name: none when it only
 * repeats the name, or is the "Default Title" placeholder of a one-size product.
 */
export function distinctVariantName(productName: string | null, variantName: string | null): string | null {
  const variant = variantName?.trim();
  if (!variant) return null;
  const same = variant.toLowerCase() === (productName ?? "").trim().toLowerCase();
  return same || variant.toLowerCase() === "default title" ? null : variant;
}
