import type { AfterSalesKind } from "../types/afterSales";
import type { FlowDraft } from "./afterSalesFlow";

/**
 * The guided return / exchange in progress, kept for this browser tab so a
 * reload or a dropped connection does not lose it. Per order; cleared once the
 * request is sent. Session storage only: nothing outlives the tab.
 */
export type SavedFlow = { draft: FlowDraft; stepIndex: number };

const key = (orderRef: string) => `sa_after_sales_flow_${orderRef}`;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

const isKind = (value: unknown): value is AfterSalesKind => value === "return" || value === "exchange";

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  Boolean(value) && typeof value === "object" && Object.values(value as object).every((v) => typeof v === "number");

const isStringRecord = (value: unknown): value is Record<string, string> =>
  Boolean(value) && typeof value === "object" && Object.values(value as object).every((v) => typeof v === "string");

/** A saved flow, or null when none (or it does not look like one). */
export function readSavedFlow(orderRef: string): SavedFlow | null {
  const raw = storage()?.getItem(key(orderRef));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { draft?: Partial<FlowDraft>; stepIndex?: unknown };
    const d = parsed.draft;
    if (!d || !isKind(d.kind) || !isNumberRecord(d.quantities) || !isStringRecord(d.replacements)) return null;
    return {
      draft: {
        kind: d.kind,
        quantities: d.quantities,
        reasonCode: typeof d.reasonCode === "string" ? d.reasonCode : null,
        reasonText: typeof d.reasonText === "string" ? d.reasonText : "",
        replacements: d.replacements,
        note: typeof d.note === "string" ? d.note : "",
      },
      stepIndex: typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0 ? Math.floor(parsed.stepIndex) : 0,
    };
  } catch {
    return null;
  }
}

export function saveFlow(orderRef: string, saved: SavedFlow): void {
  try {
    storage()?.setItem(key(orderRef), JSON.stringify(saved));
  } catch {
    // Full or blocked storage: the flow still works, it just won't survive a reload.
  }
}

export function clearSavedFlow(orderRef: string): void {
  try {
    storage()?.removeItem(key(orderRef));
  } catch {
    // nothing to clear
  }
}
