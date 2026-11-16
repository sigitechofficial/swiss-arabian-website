import type { PaymentMethodOption } from "../types/checkout";
import { baseLanguage } from "@/lib/i18n/locales";

/**
 * Tamara (BNPL) helpers. Backend contract: provider `tamara`, method
 * `tamara_installments`, hosted checkout on `*.tamara.co`, return to
 * `/payments/tamara/return`. Messages match the backend's own copy.
 */

export type TamaraLang = "en" | "ar";

export type TamaraMessage = { en: string; ar: string };

/** Pre-check said no, or Tamara isn't offered for this order. */
export const TAMARA_NOT_AVAILABLE_MESSAGE: TamaraMessage = {
  en: "Sorry, Tamara is not available for this order. Please use an alternative payment method.",
  ar: "نأسف، خدمة تمارا غير متاحة لهذا الطلب. الرجاء استخدام طريقة دفع أخرى.",
};

/** Tamara declined the purchase (at start, or on return). */
export const TAMARA_REJECTED_MESSAGE: TamaraMessage = {
  en: "Tamara could not approve this purchase. Please choose another payment method.",
  ar: "لم تتمكن تمارا من الموافقة على هذه العملية. الرجاء اختيار طريقة دفع أخرى.",
};

export const TAMARA_CANCELLED_MESSAGE: TamaraMessage = {
  en: "You cancelled the Tamara payment. Please retry or choose another payment method.",
  ar: "لقد ألغيت الدفع عبر تمارا. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى.",
};

/** Countries / currencies Tamara serves for this storefront. */
const TAMARA_COUNTRY_BY_CURRENCY: Record<string, "AE" | "SA"> = { AED: "AE", SAR: "SA" };

/** Languages Tamara's widget and wording come in; any other page language uses English. */
const TAMARA_LANGUAGES: readonly TamaraLang[] = ["en", "ar"];

export function tamaraLang(locale: string | null | undefined): TamaraLang {
  const base = baseLanguage(locale);
  return TAMARA_LANGUAGES.find((lang) => lang === base) ?? "en";
}

/** `AE` / `SA` for a currency Tamara covers here, otherwise `null`. */
export function tamaraCountry(currency: string | null | undefined): "AE" | "SA" | null {
  return TAMARA_COUNTRY_BY_CURRENCY[(currency ?? "").trim().toUpperCase()] ?? null;
}

export function isTamaraPaymentMethod(
  method: Pick<PaymentMethodOption, "providerCode" | "methodCode">,
): boolean {
  return (
    method.providerCode?.toLowerCase() === "tamara" ||
    (method.methodCode ?? "").toLowerCase().startsWith("tamara")
  );
}

/** Widget public key the backend may send on the method (`metadata.tamara.publicKey`); `""` when absent. */
export function tamaraPublicKeyFrom(
  method: Pick<PaymentMethodOption, "metadata"> | null | undefined,
): string {
  const raw = method?.metadata?.tamara;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const key = (raw as Record<string, unknown>).publicKey;
  return typeof key === "string" ? key.trim() : "";
}

/** Tamara's hosted checkout: https on `tamara.co` or a subdomain (sandbox included). */
export function isTamaraCheckoutUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /(^|\.)tamara\.co$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function readMessage(value: unknown): TamaraMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { en, ar } = value as Record<string, unknown>;
  if (typeof en === "string" && en.trim() && typeof ar === "string" && ar.trim()) {
    return { en: en.trim(), ar: ar.trim() };
  }
  return null;
}

/** Backend's reason code → the matching default wording. */
export function tamaraMessageForReason(reason: string | null | undefined): TamaraMessage {
  const key = (reason ?? "").trim().toLowerCase();
  if (key === "cancel" || key === "cancelled" || key === "canceled") return TAMARA_CANCELLED_MESSAGE;
  if (key === "declined" || key === "rejected") return TAMARA_REJECTED_MESSAGE;
  return TAMARA_NOT_AVAILABLE_MESSAGE;
}

/**
 * Tamara declined the purchase when the payment was started (never an error to log).
 * The backend sets `metadata.tamaraRejectionReason` and
 * `metadata.tamaraRejectionMessage` (`{ en, ar }`), same as Tabby. A nested
 * `metadata.tamara.{rejectionReason, rejectionMessage}` is also accepted.
 */
export function tamaraRejectionFrom(
  metadata: Record<string, unknown> | null | undefined,
): TamaraMessage | null {
  const flatReason =
    typeof metadata?.tamaraRejectionReason === "string"
      ? metadata.tamaraRejectionReason.trim()
      : "";
  if (flatReason) {
    return (
      readMessage(metadata?.tamaraRejectionMessage) ??
      tamaraMessageForReason(flatReason)
    );
  }
  const raw = metadata?.tamara;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const tamara = raw as Record<string, unknown>;
  const reason = typeof tamara.rejectionReason === "string" ? tamara.rejectionReason.trim() : "";
  if (!reason) return null;
  return readMessage(tamara.rejectionMessage) ?? tamaraMessageForReason(reason);
}

/** Pre-check response → message. Accepts `{ messageEn, messageAr }` or `{ message: { en, ar } }`. */
export function tamaraPrecheckMessage(res: {
  rejectionReason?: string | null;
  messageEn?: string | null;
  messageAr?: string | null;
  message?: { en?: string | null; ar?: string | null } | null;
}): TamaraMessage {
  return (
    readMessage({ en: res.messageEn, ar: res.messageAr }) ??
    readMessage(res.message) ??
    tamaraMessageForReason(res.rejectionReason ?? null)
  );
}

/**
 * Tamara couldn't open a payment session (no redirect, not a rejection).
 * Backend `warnings` are never shown as-is, only read for the detail to fix.
 */
export function tamaraStartFailureMessage(warnings: readonly string[] | null | undefined): string {
  const text = (warnings ?? []).join(" ").toLowerCase();
  if (/phone/.test(text)) {
    return "Tamara couldn’t accept your phone number. Check it (e.g. +971 50 123 4567), then try Pay again. Your order is saved.";
  }
  if (/e-?mail/.test(text)) {
    return "Tamara couldn’t accept your email address. Check it, then try Pay again. Your order is saved.";
  }
  if (/address|city|zip/.test(text)) {
    return "Tamara couldn’t accept your delivery address. Check it, then try Pay again. Your order is saved.";
  }
  return "Tamara is unavailable right now. Try Pay again or choose another payment method. Your order is saved.";
}

/** Pre-check needs a real email and phone; before that Tamara simply stays available. */
export function canPrecheckTamara(email: string, phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && digits.length >= 9;
}

/** Plain wording under the Tamara option when the widget can't be shown. */
export function tamaraFallbackText(total: number, currency: string, lang: TamaraLang): string {
  const cents = Math.round(total * 100);
  const each = (Math.floor(cents / 4) / 100).toFixed(2);
  return lang === "ar"
    ? `قسّمها على 4 دفعات بقيمة ${each} ${currency} بدون فوائد مع تمارا.`
    : `Split into 4 interest-free payments of ${currency} ${each} with Tamara.`;
}
