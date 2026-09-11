import { formatMoney } from "@/features/home/utils/formatMoney";
import type { DeliveryMethodOption, PaymentMethodOption } from "../types/checkout";

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Payment ────────────────────────────────────────────────────────────────

export function isStripePaymentMethod(
  method: Pick<PaymentMethodOption, "providerCode" | "methodCode">,
): boolean {
  return (
    method.providerCode?.toLowerCase() === "stripe" ||
    method.methodCode?.toLowerCase() === "stripe_card"
  );
}

/** Backend default first, skipping anything explicitly disabled. */
export function pickDefaultPaymentMethod(
  methods: PaymentMethodOption[],
): PaymentMethodOption | undefined {
  const enabled = methods.filter((m) => m.isEnabled !== false);
  const pool = enabled.length ? enabled : methods;
  return pool.find((m) => m.isDefault) ?? pool[0];
}

export function paymentMethodNote(method: PaymentMethodOption): string {
  if (isStripePaymentMethod(method)) {
    return "Enter your card securely with Stripe on the next step";
  }
  if (method.providerCode?.toLowerCase() === "paymob") {
    return "Visa, Mastercard · completed on Paymob’s secure page";
  }
  if (method.requiresRedirect) {
    return "Completed on the provider’s secure page";
  }
  return "";
}

// ─── Delivery ───────────────────────────────────────────────────────────────

export function deliveryEta(method: DeliveryMethodOption): string {
  const min = method.metadata?.estimatedMinDays;
  const max = method.metadata?.estimatedMaxDays;
  if (typeof min === "number" && typeof max === "number" && min !== max) {
    return `Arrives in ${min}–${max} working days`;
  }
  const days = typeof max === "number" ? max : min;
  if (typeof days === "number") {
    return `Arrives in ${days} working ${days === 1 ? "day" : "days"}`;
  }
  return "";
}

/** The guide treats a `null` fee as free / not priced — never as unknown cost. */
export function deliveryFeeLabel(method: DeliveryMethodOption, currency: string): string {
  if (method.estimatedFee == null) return "Free";
  const fee = Number(method.estimatedFee);
  return Number.isFinite(fee) && fee > 0 ? formatMoney(fee, currency) : "Free";
}

// ─── Order summaries (confirmation page) ────────────────────────────────────

export function orderPaymentLabel(
  method: { providerCode: string | null; methodCode: string | null } | null,
): string {
  if (!method) return "—";
  const provider = method.providerCode?.toLowerCase();
  if (provider === "paymob") return "Card · Paymob";
  if (provider === "stripe") return "Card · Stripe";
  return titleCase(method.methodCode ?? method.providerCode ?? "") || "—";
}

/** `iq_fulfillment` + `iq_standard` → "Standard delivery". */
export function orderDeliveryLabel(
  method: { partnerCode: string | null; methodCode: string | null } | null,
): string {
  const code = method?.methodCode ?? "";
  if (!code) return "Standard delivery";
  const partnerPrefix = method?.partnerCode?.split(/[_-]/)[0]?.toLowerCase();
  const parts = code.split(/[_-]/);
  const trimmed =
    partnerPrefix && parts.length > 1 && parts[0].toLowerCase() === partnerPrefix
      ? parts.slice(1).join(" ")
      : code;
  const label = titleCase(trimmed);
  return /delivery|shipping|collect/i.test(label) ? label : `${label} delivery`;
}
