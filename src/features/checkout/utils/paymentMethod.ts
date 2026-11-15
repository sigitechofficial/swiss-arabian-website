import type { PaymentMethodOption } from "../types/checkout";

export function isPaymobPaymentMethod(method: PaymentMethodOption): boolean {
  const provider = method.providerCode?.trim().toLowerCase() ?? "";
  const code = method.methodCode?.trim().toLowerCase() ?? "";
  if (provider.includes("paymob") || code === "paymob_card") return true;
  if (code === "card" && method.requiresRedirect === true) return true;
  return false;
}

function isSelectable(method: PaymentMethodOption): boolean {
  return method.isEnabled !== false;
}

/**
 * The market's default method (admin Market → Payments), else the first. Which
 * methods a market offers, and in which order, is decided in the admin and on
 * the integrations switchboard (ADR-005), never by a website build setting.
 */
export function pickPreferredPaymentMethod(
  methods: PaymentMethodOption[],
): PaymentMethodOption | undefined {
  const list = methods.filter(isSelectable);
  const pool = list.length > 0 ? list : methods;
  return pool.find((method) => method.isDefault) ?? pool[0];
}

/** The backend's order (the market's sort order). */
export function sortPaymentMethodsForDisplay(
  methods: PaymentMethodOption[],
): PaymentMethodOption[] {
  return [...methods];
}
