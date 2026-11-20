import { formatMoney } from "@/features/home/utils/formatMoney";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import type { DeliveryMethodOption, PaymentMethodOption } from "../types/checkout";
import { isTabbyPaymentMethod } from "./tabby";
import { isTamaraPaymentMethod } from "./tamara";

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

export function isSmokePaymentMethod(
  method: Pick<PaymentMethodOption, "providerCode" | "methodCode" | "displayName">,
): boolean {
  const blob = `${method.providerCode ?? ""} ${method.methodCode ?? ""} ${method.displayName ?? ""}`.toLowerCase();
  return blob.includes("smoke") || blob.includes("test payment");
}

export function isTelrPaymentMethod(
  method: Pick<PaymentMethodOption, "providerCode" | "methodCode" | "displayName">,
): boolean {
  const blob = `${method.providerCode ?? ""} ${method.methodCode ?? ""} ${method.displayName ?? ""}`.toLowerCase();
  return blob.includes("telr");
}

/** Card iframes (Stripe / Paymob). Test Payment skips this and goes to confirmation. */
export function usesInlineCardForm(
  method: Pick<PaymentMethodOption, "providerCode" | "methodCode" | "displayName">,
): boolean {
  if (isSmokePaymentMethod(method)) return false;
  return isStripePaymentMethod(method) || method.providerCode?.toLowerCase() === "paymob";
}

/** Hosted redirect gateways (Telr HPP, Tabby, Tamara, and any method flagged `requiresRedirect`). */
export function usesHostedRedirect(
  method: Pick<
    PaymentMethodOption,
    "providerCode" | "methodCode" | "displayName" | "requiresRedirect"
  >,
): boolean {
  if (isSmokePaymentMethod(method) || usesInlineCardForm(method)) return false;
  return (
    Boolean(method.requiresRedirect) ||
    isTelrPaymentMethod(method) ||
    isTabbyPaymentMethod(method) ||
    isTamaraPaymentMethod(method)
  );
}

export type PaymentStepKind = "card" | "tabby" | "tamara" | "cash";

/**
 * The ways to pay this checkout really offers, in a fixed order, for the step
 * hint ("Card, Tabby, Tamara or cash"). Built from the market's live methods: nothing
 * the shopper can't pick (SE-8). Test Payment is not a way to pay.
 */
export function paymentStepKinds(methods: PaymentMethodOption[]): PaymentStepKind[] {
  const live = methods.filter((m) => m.isEnabled !== false && !isSmokePaymentMethod(m));
  const kinds = new Set<PaymentStepKind>();
  for (const method of live) {
    if (isTabbyPaymentMethod(method)) kinds.add("tabby");
    else if (isTamaraPaymentMethod(method)) kinds.add("tamara");
    else if (/cod|cash/i.test(`${method.providerCode ?? ""} ${method.methodCode} ${method.displayName}`)) kinds.add("cash");
    else if (usesInlineCardForm(method) || isTelrPaymentMethod(method) || /card/i.test(`${method.methodCode} ${method.displayName}`)) {
      kinds.add("card");
    }
  }
  return (["card", "tabby", "tamara", "cash"] as const).filter((kind) => kinds.has(kind));
}

/** Backend default first, skipping anything explicitly disabled. */
export function pickDefaultPaymentMethod(
  methods: PaymentMethodOption[],
): PaymentMethodOption | undefined {
  const enabled = methods.filter((m) => m.isEnabled !== false);
  const pool = enabled.length ? enabled : methods;
  return pool.find((m) => m.isDefault) ?? pool[0];
}

export function paymentMethodNote(method: PaymentMethodOption, t: Translator = pageTranslator()): string {
  // Provider and card scheme names are the same in every language.
  if (isStripePaymentMethod(method)) {
    return "Stripe · Visa, Mastercard, Amex";
  }
  if (method.providerCode?.toLowerCase() === "paymob") {
    return "Paymob · Visa, Mastercard, Amex, Jaywan";
  }
  if (isTelrPaymentMethod(method)) {
    return t("checkout.method.telrNote");
  }
  if (isTabbyPaymentMethod(method)) {
    // Tabby QA: no plan caption. Tabby offers more plans than Pay in 4 (some
    // with a fee); the Tabby snippet under the method shows the real ones.
    return "";
  }
  if (isTamaraPaymentMethod(method)) {
    return t("checkout.method.tamaraNote");
  }
  if (method.requiresRedirect) {
    return t("checkout.method.redirectNote");
  }
  return "";
}

export interface UpcomingPaymentMethod {
  id: string;
  title: string;
  note: string;
  /** This row pays through a provider that is already enabled. */
  selectsProvider?: "stripe";
}

/** Methods shoppers expect that are not a live zone method yet. */
export function upcomingPaymentMethods(
  countryCode: string | null | undefined,
  methods: PaymentMethodOption[],
  t: Translator = pageTranslator(),
): UpcomingPaymentMethod[] {
  const country = (countryCode || "AE").toUpperCase();
  const paymob = methods.some((method) => method.providerCode?.toLowerCase() === "paymob");
  const stripe = methods.some((method) => isStripePaymentMethod(method));
  const rows: UpcomingPaymentMethod[] = [];

  if (paymob && (country === "AE" || country === "SA" || country === "OM")) {
    rows.push({ id: "paymob-apple-pay", title: "Apple Pay", note: "Paymob" });
  }
  if (stripe) {
    rows.push({
      id: "stripe-apple-pay",
      title: "Apple Pay",
      note: "Stripe",
      selectsProvider: "stripe",
    });
  }
  if (paymob && (country === "AE" || country === "SA")) {
    rows.push({ id: "paymob-google-pay", title: "Google Pay", note: "Paymob" });
  }
  if (stripe) {
    rows.push({
      id: "stripe-google-pay",
      title: "Google Pay",
      note: "Stripe",
      selectsProvider: "stripe",
    });
  }
  if (paymob && country === "SA") {
    rows.push({ id: "mada", title: "mada", note: "Paymob" });
    rows.push({ id: "stc-pay", title: "STC Pay", note: "Paymob" });
  }
  // No "coming soon" Tabby or Tamara rows: both are direct integrations, listed
  // only where the market's checkout offers them (and not for a bag the provider
  // declined), never advertised elsewhere (Tabby QA, Nov 2026).
  if (country === "KW") {
    rows.push({ id: "knet", title: "KNET", note: t("checkout.method.knetNote") });
  }
  if (country === "OM") {
    rows.push({ id: "omannet", title: "OmanNet", note: t("checkout.method.omannetNote") });
  }
  if (country === "QA") {
    rows.push({ id: "naps", title: "NAPS", note: t("checkout.method.napsNote") });
  }
  const hasCash = methods.some((method) =>
    /cod|cash/i.test(`${method.providerCode ?? ""} ${method.methodCode} ${method.displayName}`),
  );
  if (!hasCash && (country === "AE" || country === "SA" || country === "KW" || country === "OM" || country === "QA")) {
    rows.push({ id: "cash-on-delivery", title: t("payments.cod"), note: t("checkout.method.codNote") });
  }
  return rows;
}

// ─── Delivery ───────────────────────────────────────────────────────────────

export function deliveryEta(method: DeliveryMethodOption, t: Translator = pageTranslator()): string {
  const min = method.metadata?.estimatedMinDays;
  const max = method.metadata?.estimatedMaxDays;
  if (typeof min === "number" && typeof max === "number" && min !== max) {
    return t("checkout.delivery.etaRange", { min, max });
  }
  const days = typeof max === "number" ? max : min;
  if (typeof days === "number") {
    return t("checkout.delivery.etaDays", { count: days });
  }
  return "";
}

/**
 * The guide says a `null` fee is "free / TBD". The backend sends it when the market has no fee
 * configured, and then keeps the session's previous shipping amount, so "Free" could be wrong.
 * Only an explicit 0 is labelled "Free"; a missing fee shows no price (the summary shows the real amount).
 */
export function deliveryFeeLabel(
  method: DeliveryMethodOption,
  currency: string,
  t: Translator = pageTranslator(),
): string {
  if (method.estimatedFee == null || method.estimatedFee.trim() === "") return "";
  const fee = Number(method.estimatedFee);
  if (!Number.isFinite(fee)) return "";
  return fee > 0 ? formatMoney(fee, currency) : t("orders.free");
}

// ─── Order summaries (confirmation page) ────────────────────────────────────

export function orderPaymentLabel(
  method: { providerCode: string | null; methodCode: string | null; displayName?: string | null } | null,
  t: Translator = pageTranslator(),
): string {
  if (!method) return "—";
  // The backend sends the shopper-facing PaymentMethod.displayName; codes are a fallback only.
  const displayName = method.displayName?.trim();
  if (displayName) return displayName;
  const provider = method.providerCode?.toLowerCase();
  if (provider === "paymob") return t("checkout.method.cardVia", { provider: "Paymob" });
  if (provider === "stripe") return t("checkout.method.cardVia", { provider: "Stripe" });
  return titleCase(method.methodCode ?? method.providerCode ?? "") || "—";
}

/** `iq_fulfillment` + `iq_standard` → "Standard delivery". */
export function orderDeliveryLabel(
  method: { partnerCode: string | null; methodCode: string | null } | null,
  t: Translator = pageTranslator(),
): string {
  const code = method?.methodCode ?? "";
  if (!code) return t("checkout.delivery.standard");
  // Drop every leading word the method code shares with the partner code:
  // `sapil_demo_courier` + `sapil_demo_standard` → "standard", `smoke_standard` + `smoke_standard_standard` → "standard".
  const partnerParts = (method?.partnerCode ?? "").toLowerCase().split(/[_-]/).filter(Boolean);
  const parts = code.split(/[_-]/).filter(Boolean);
  let shared = 0;
  while (shared < parts.length - 1 && shared < partnerParts.length && parts[shared].toLowerCase() === partnerParts[shared]) {
    shared += 1;
  }
  const trimmed = shared > 0 ? parts.slice(shared).join(" ") : code;
  const label = titleCase(trimmed);
  // The label is built from the method's code (no shopper name was sent).
  return /delivery|shipping|collect/i.test(label) ? label : t("checkout.delivery.named", { name: label });
}

/** "iq_fulfillment" -> "Iq Fulfillment"; used only to tell same-named options apart. */
function partnerLabel(code: string | null | undefined): string {
  return String(code ?? "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Several partners can expose an option with the same name (URD1 had three
 * "Standard delivery" rows). When names collide, add the partner so the
 * shopper can tell which one they pick. Keyed by zoneDeliveryMethodId.
 */
export function deliveryOptionTitles(methods: DeliveryMethodOption[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const method of methods) {
    counts.set(method.displayName, (counts.get(method.displayName) ?? 0) + 1);
  }
  return new Map(
    methods.map((method) => {
      const partner = partnerLabel(method.partnerCode);
      const title =
        (counts.get(method.displayName) ?? 0) > 1 && partner
          ? `${method.displayName} · ${partner}`
          : method.displayName;
      return [method.zoneDeliveryMethodId, title];
    }),
  );
}
