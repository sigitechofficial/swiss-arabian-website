import { env } from "@/lib/config/env";
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

/** Paymob first when the FE flag is on and the zone offers it; otherwise backend default. */
export function pickPreferredPaymentMethod(
  methods: PaymentMethodOption[],
): PaymentMethodOption | undefined {
  const list = methods.filter(isSelectable);
  const pool = list.length > 0 ? list : methods;
  if (env.flags.paymob) {
    return (
      pool.find((method) => isPaymobPaymentMethod(method) && method.isDefault) ??
      pool.find(isPaymobPaymentMethod) ??
      pool.find((method) => method.isDefault) ??
      pool[0]
    );
  }
  return pool.find((method) => method.isDefault) ?? pool[0];
}

export function sortPaymentMethodsForDisplay(
  methods: PaymentMethodOption[],
): PaymentMethodOption[] {
  if (!env.flags.paymob) return [...methods];
  return [...methods].sort((a, b) => {
    const aPaymob = isPaymobPaymentMethod(a) ? 0 : 1;
    const bPaymob = isPaymobPaymentMethod(b) ? 0 : 1;
    return aPaymob - bPaymob;
  });
}
