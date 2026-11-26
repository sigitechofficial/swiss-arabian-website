import { formatMoney } from "@/lib/format/money";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import type { StorefrontShippingPromise } from "../types/pdpShipping";

function asInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim());
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function parseShippingPromise(raw: unknown): StorefrontShippingPromise | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const zoneDeliveryMethodId = asText(row.zoneDeliveryMethodId);
  const partnerCode = asText(row.partnerCode);
  const methodCode = asText(row.methodCode);
  const displayName = asText(row.displayName);
  const currencyCode = asText(row.currencyCode);
  if (!zoneDeliveryMethodId || !partnerCode || !methodCode || !displayName || !currencyCode) {
    return null;
  }
  return {
    zoneDeliveryMethodId,
    partnerCode,
    methodCode,
    displayName,
    isDefault: row.isDefault === true,
    estimatedMinDays: asInt(row.estimatedMinDays),
    estimatedMaxDays: asInt(row.estimatedMaxDays),
    currencyCode,
    baseDeliveryFee: asText(row.baseDeliveryFee),
    freeDeliveryThreshold: asText(row.freeDeliveryThreshold),
  };
}

export function shippingDaysLine(
  promise: StorefrontShippingPromise,
  t: Translator = pageTranslator(),
): string | null {
  const min = promise.estimatedMinDays;
  const max = promise.estimatedMaxDays;
  if (min != null && max != null) {
    const days = min === max ? String(min) : `${min}–${max}`;
    return t("pdp.shipping.days", { days });
  }
  if (min != null) return t("pdp.shipping.days", { days: String(min) });
  if (max != null) return t("pdp.shipping.days", { days: String(max) });
  return null;
}

export function shippingThresholdLine(
  promise: StorefrontShippingPromise,
  t: Translator = pageTranslator(),
): string | null {
  const raw = promise.freeDeliveryThreshold;
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return t("pdp.shipping.freeOver", { amount: formatMoney(amount, promise.currencyCode) });
}

export function shippingTabCopy(
  promise: StorefrontShippingPromise | null,
  t: Translator = pageTranslator(),
): string | null {
  if (!promise) return null;
  const days = shippingDaysLine(promise, t);
  const free = shippingThresholdLine(promise, t);
  const parts = [days, free].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}
