import type { PaymentMethodOption } from "../types/checkout";
import { baseLanguage } from "@/lib/i18n/locales";

/**
 * Tabby (pay in 4) helpers. Backend contract: `docs/storefront/TABBY_CHECKOUT.md`.
 * Messages below are the wording Tabby requires — do not rephrase them.
 */

export type TabbyLang = "en" | "ar";

export type TabbyMessage = { en: string; ar: string };

export const TABBY_REJECTED_MESSAGE: TabbyMessage = {
  en: "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.",
  ar: "نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.",
};

export const TABBY_CANCELLED_MESSAGE: TabbyMessage = {
  en: "You aborted the payment. Please retry or choose another payment method.",
  ar: "لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى.",
};

/** Languages Tabby's snippets and wording come in; any other page language uses English. */
const TABBY_LANGUAGES: readonly TabbyLang[] = ["en", "ar"];

export function tabbyLang(locale: string | null | undefined): TabbyLang {
  const base = baseLanguage(locale);
  return TABBY_LANGUAGES.find((lang) => lang === base) ?? "en";
}

export function isTabbyPaymentMethod(
  method: Pick<PaymentMethodOption, "providerCode" | "methodCode">,
): boolean {
  return (
    method.providerCode?.toLowerCase() === "tabby" ||
    (method.methodCode ?? "").toLowerCase().startsWith("tabby")
  );
}

export type TabbySnippetConfig = {
  publicKey: string;
  merchantCode: string;
  currency: string;
  /** `https://checkout.tabby.ai` (UAE) or `https://checkout.tabby.sa` (KSA). */
  snippetScriptBase: string;
};

function isTabbyHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /(^|\.)tabby\.(ai|sa)$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Snippet settings the backend sends on the Tabby method (`metadata.tabby`).
 * `null` when anything is missing — the card then falls back to plain text.
 */
export function tabbySnippetConfig(
  method: Pick<PaymentMethodOption, "metadata"> | null | undefined,
): TabbySnippetConfig | null {
  const raw = method?.metadata?.tabby;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const tabby = raw as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const publicKey = text(tabby.publicKey);
  const merchantCode = text(tabby.merchantCode);
  const currency = text(tabby.currency).toUpperCase();
  const snippetScriptBase = text(tabby.snippetScriptBase).replace(/\/+$/, "");
  if (!publicKey || !merchantCode || !currency || !isTabbyHost(snippetScriptBase)) return null;
  return { publicKey, merchantCode, currency, snippetScriptBase };
}

/** Tabby rejected the purchase when the payment was started (never an error to log). */
export function tabbyRejectionFrom(
  metadata: Record<string, unknown> | null | undefined,
): TabbyMessage | null {
  if (!metadata || !metadata.tabbyRejectionReason) return null;
  const message = metadata.tabbyRejectionMessage;
  if (message && typeof message === "object" && !Array.isArray(message)) {
    const { en, ar } = message as Record<string, unknown>;
    if (typeof en === "string" && en.trim() && typeof ar === "string" && ar.trim()) {
      return { en: en.trim(), ar: ar.trim() };
    }
  }
  return TABBY_REJECTED_MESSAGE;
}

/**
 * Tabby couldn't open a payment session (no redirect, not a rejection).
 * The backend passes Tabby's own error text only as `warnings` — never shown
 * as-is, but read here so the shopper learns which detail to fix.
 */
export function tabbyStartFailureMessage(warnings: readonly string[] | null | undefined): string {
  const text = (warnings ?? []).join(" ").toLowerCase();
  if (/phone/.test(text)) {
    return "Tabby couldn’t accept your phone number. Check it (e.g. +971 50 123 4567), then try Pay again. Your order is saved.";
  }
  if (/e-?mail/.test(text)) {
    return "Tabby couldn’t accept your email address. Check it, then try Pay again. Your order is saved.";
  }
  if (/address|city|zip/.test(text)) {
    return "Tabby couldn’t accept your delivery address. Check it, then try Pay again. Your order is saved.";
  }
  return "Tabby is unavailable right now. Try Pay again or choose another payment method. Your order is saved.";
}

/** Pre-scoring needs a real email and phone; before that Tabby simply stays available. */
export function canPrescoreTabby(email: string, phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && digits.length >= 9;
}

/**
 * Tabby's wording for when their checkout snippet can't be shown.
 * The amount is their formula: `total × 1.015 / 4`.
 */
export function tabbyFallbackText(total: number, currency: string, lang: TabbyLang): string {
  const decimals = currency.toUpperCase() === "KWD" ? 3 : 2;
  const each = ((total * 1.015) / 4).toFixed(decimals);
  const text: TabbyMessage = {
    en: `4 payments of ${currency} ${each}/mo or up to 12 months.`,
    ar: `4 دفعات بقيمة ${each} ${currency} شهريًا أو حتى 12 شهرًا.`,
  };
  return text[lang];
}

/** Tabby price format: decimal string in major units. */
export function tabbyPrice(total: number, currency: string): string {
  return total.toFixed(currency.toUpperCase() === "KWD" ? 3 : 2);
}
