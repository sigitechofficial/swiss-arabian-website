import { KeyedError } from "@/lib/i18n/keyedError";
import { englishTranslator, type MessageKey, type Translator } from "@/lib/i18n/messages";
import type {
  PlanProduct,
  PublicSubscriptionConsent,
  RegisterSubscriptionBody,
  SubscriptionAudience,
  SubscriptionQueueItem,
  SubscriptionQueueView,
  SubscriptionSelectionMode,
} from "../types/subscription.types";

export const CONSENT_REFRESH_CODES = new Set([
  "SUB_CONSENT_UNAVAILABLE",
  "SUB_CONSENT_STALE",
  "SUB_CONSENT_VERSION_INVALID",
]);

/** Storefront queue length. The API still accepts 20; that gap is not raised here. */
export const QUEUE_CLIENT_LIMIT = 12;

/** Message key: no published Surprise schedule for the chosen audience. */
export const SCHEDULE_UNAVAILABLE_MESSAGE: MessageKey = "subs.schedule.unavailable";

/**
 * A subscription rule the browser checks before calling the server (queue
 * size, audience…). Shown through the translator like any other failure.
 */
export class SubscriptionRuleError extends KeyedError {
  constructor(messageKey: MessageKey) {
    super(messageKey);
    this.name = "SubscriptionRuleError";
  }
}

export function isSubscriptionAudience(value: unknown): value is SubscriptionAudience {
  return value === "MEN" || value === "WOMEN";
}

export function audienceLabel(audience: SubscriptionAudience | null | undefined, t: Translator = englishTranslator): string {
  if (audience === "MEN") return t("subs.audience.men");
  if (audience === "WOMEN") return t("subs.audience.women");
  return t("subs.audience.none");
}

/** Drop picks the audience-filtered product list no longer returns. */
export function retainAudienceSelections(
  selected: readonly string[],
  eligibleIds: readonly string[],
): { selected: string[]; removed: number } {
  const allowed = new Set(eligibleIds);
  const next = selected.filter((id) => allowed.has(id));
  return { selected: next, removed: selected.length - next.length };
}

export function audienceChangeNotice(removed: number, t: Translator = englishTranslator): string | null {
  if (removed < 1) return null;
  return t("subs.audienceRemoved", { count: removed });
}

/** Only an explicit published agreement can be shown or submitted. */
export function activeRegistrationConsent(
  value: PublicSubscriptionConsent | null | undefined,
): { version: string; text: string; publishedAt: string | null } | null {
  if (!value || value.available !== true) return null;
  if (typeof value.version !== "string" || value.version.trim() === "") return null;
  if (typeof value.text !== "string" || value.text.trim() === "") return null;
  return { version: value.version, text: value.text, publishedAt: value.publishedAt };
}

export function planFeeLabel(
  amount: string,
  currencyCode: string,
  intervalUnit: string,
  t: Translator = englishTranslator,
): string {
  const price = `${currencyCode} ${amount}`;
  return intervalUnit === "MONTH"
    ? t("subs.price.perMonth", { amount: price })
    : t("subs.price.perInterval", { amount: price, interval: intervalUnit.toLowerCase() });
}

const MONEY = /^\d+\.\d{2}$/;

export type SubscriptionPriceLines =
  | {
      available: true;
      subscription: string;
      shipping: string;
      total: string;
      totalAmount: string;
    }
  | { available: false; message: string };

/**
 * Display copy for a server price snapshot.
 * monthlyTotal is used as given. A missing total falls back only when shipping is included and zero.
 */
export function subscriptionPriceLines(
  input: {
    amount?: string | null;
    currencyCode?: string | null;
    shippingMode?: string | null;
    shippingAmount?: string | null;
    monthlyTotal?: string | null;
  },
  t: Translator = englishTranslator,
): SubscriptionPriceLines {
  const unavailable = { available: false as const, message: t("subs.price.unavailable") };
  const currency = input.currencyCode?.trim().toUpperCase() ?? "";
  const amount = input.amount?.trim() ?? "";
  if (!currency || !MONEY.test(amount)) {
    return unavailable;
  }
  const mode = input.shippingMode === "EXTRA_FIXED" ? "EXTRA_FIXED" : input.shippingMode ?? "INCLUDED";
  const shippingAmount = input.shippingAmount?.trim() || "0.00";
  const serverTotal = input.monthlyTotal?.trim() ?? "";
  const includedZero =
    mode === "INCLUDED" && (input.shippingAmount == null || shippingAmount === "0.00" || shippingAmount === "0");
  if (mode !== "INCLUDED" && mode !== "EXTRA_FIXED") {
    return unavailable;
  }
  if (mode === "EXTRA_FIXED" && !MONEY.test(shippingAmount)) {
    return unavailable;
  }
  if (MONEY.test(serverTotal)) {
    return {
      available: true,
      subscription: t("subs.price.subscription", { amount: `${currency} ${amount}` }),
      shipping:
        mode === "EXTRA_FIXED"
          ? t("subs.price.shipping", { amount: `${currency} ${shippingAmount}` })
          : t("subs.price.shippingIncluded"),
      total: t("subs.price.total", { amount: `${currency} ${serverTotal}` }),
      totalAmount: serverTotal,
    };
  }
  if (includedZero) {
    return {
      available: true,
      subscription: t("subs.price.subscription", { amount: `${currency} ${amount}` }),
      shipping: t("subs.price.shippingIncluded"),
      total: t("subs.price.total", { amount: `${currency} ${amount}` }),
      totalAmount: amount,
    };
  }
  return unavailable;
}

/** Eligible products are exactly the API rows. Retail price is never a filter. */
export function selectableProducts<T extends { variantId: string; retailPrice?: number | null }>(
  items: T[],
): T[] {
  return items.filter((item) => Boolean(item.variantId));
}

export function searchPlanProducts(items: PlanProduct[], query: string): PlanProduct[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) || item.sku.toLowerCase().includes(needle),
  );
}

export function selectVariant(
  mode: SubscriptionSelectionMode,
  selected: string[],
  variantId: string,
  allowed: ReadonlySet<string>,
): string[] {
  if (!allowed.has(variantId)) {
    throw new SubscriptionRuleError("subs.rule.notOnPlan");
  }
  if (mode === "SURPRISE") return [];
  if (mode === "REPLENISHMENT") return [variantId];
  if (selected.includes(variantId)) return selected;
  if (selected.length >= QUEUE_CLIENT_LIMIT) {
    throw new SubscriptionRuleError("subs.detail.queueLimit");
  }
  return [...selected, variantId];
}

export function removeVariant(selected: string[], variantId: string): string[] {
  return selected.filter((id) => id !== variantId);
}

export function moveVariant(selected: string[], index: number, direction: -1 | 1): string[] {
  const next = index + direction;
  if (index < 0 || index >= selected.length || next < 0 || next >= selected.length) {
    return selected;
  }
  const copy = [...selected];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item!);
  return copy;
}

export function buildRegisterBody(input: {
  zoneCode: string;
  planCode: string;
  mode: SubscriptionSelectionMode;
  audience: SubscriptionAudience;
  variantIds: string[];
  customerAddressId: string;
  consentTextVersion: string;
  allowedVariantIds: readonly string[];
}): RegisterSubscriptionBody {
  if (!isSubscriptionAudience(input.audience)) {
    throw new SubscriptionRuleError("subs.rule.chooseAudience");
  }
  const allowed = new Set(input.allowedVariantIds);
  const ordered = input.variantIds.filter((id, index) => input.variantIds.indexOf(id) === index);
  if (input.mode !== "SURPRISE" && ordered.some((id) => !allowed.has(id))) {
    throw new SubscriptionRuleError("subs.rule.notOnPlan");
  }
  if (input.mode === "REPLENISHMENT" && ordered.length !== 1) {
    throw new SubscriptionRuleError("subs.rule.chooseOne");
  }
  if (input.mode === "QUEUE" && ordered.length < 1) {
    throw new SubscriptionRuleError("subs.rule.addOne");
  }
  if (input.mode === "QUEUE" && ordered.length > QUEUE_CLIENT_LIMIT) {
    throw new SubscriptionRuleError("subs.detail.queueLimit");
  }
  if (input.mode === "SURPRISE" && ordered.length > 0) {
    throw new SubscriptionRuleError("subs.rule.surpriseNoList");
  }
  const body: RegisterSubscriptionBody = {
    zoneCode: input.zoneCode,
    planCode: input.planCode,
    mode: input.mode,
    audience: input.audience,
    customerAddressId: input.customerAddressId,
    consentTextVersion: input.consentTextVersion,
  };
  if (input.mode !== "SURPRISE") body.variantIds = ordered;
  return body;
}

export function registrationFingerprint(body: RegisterSubscriptionBody): string {
  return JSON.stringify({
    zoneCode: body.zoneCode,
    planCode: body.planCode,
    mode: body.mode,
    audience: body.audience,
    variantIds: body.variantIds ?? [],
    customerAddressId: body.customerAddressId,
    consentTextVersion: body.consentTextVersion,
  });
}

type KeyStore = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };

export function registrationIdempotencyKey(fingerprint: string, store: KeyStore): string {
  const storageKey = `sa-sub-idem:${fingerprint}`;
  const existing = store.getItem(storageKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  store.setItem(storageKey, created);
  return created;
}

export function replaceRegistrationIdempotencyKey(fingerprint: string, store: KeyStore): string {
  const created = crypto.randomUUID();
  store.setItem(`sa-sub-idem:${fingerprint}`, created);
  return created;
}

export function queueRows(
  queue: SubscriptionQueueItem[] | SubscriptionQueueView | null | undefined,
): SubscriptionQueueItem[] {
  if (!queue) return [];
  const items = Array.isArray(queue) ? queue : queue.items;
  return [...items].sort((a, b) => a.position - b.position);
}

export function statusLabel(status: string, t: Translator = englishTranslator): string {
  if (status === "PENDING_ACTIVATION") return t("subs.status.pending");
  if (status === "ACTIVE") return t("subs.status.active");
  if (status === "PAUSED") return t("subs.status.paused");
  if (status === "CANCELLED") return t("subs.status.cancelled");
  return status;
}

export function modeLabel(mode: SubscriptionSelectionMode, t: Translator = englishTranslator): string {
  if (mode === "REPLENISHMENT") return t("subs.mode.replenishment");
  if (mode === "QUEUE") return t("subs.mode.queue");
  return t("subs.mode.surprise");
}

/** English billing promises a pending registration must never show (checked in tests). */
const FORBIDDEN_COPY = [
  "payment successful",
  "order confirmed",
  "delivery confirmed",
  "next charge",
  "automatically renews",
  "active subscription",
];

export function registrationSuccessCopy(
  input: {
    planName: string;
    amount: string;
    currencyCode: string;
    shippingMode?: string | null;
    shippingAmount?: string | null;
    monthlyTotal?: string | null;
    mode: SubscriptionSelectionMode;
    fragranceNames: string[];
  },
  t: Translator = englishTranslator,
): string[] {
  const price = subscriptionPriceLines(input, t);
  const lines = [
    t("subs.registered.saved"),
    ...(price.available
      ? [t("subs.registered.plan", { plan: input.planName }), price.subscription, price.shipping, price.total]
      : [
          t("subs.registered.planFee", {
            plan: input.planName,
            fee: planFeeLabel(input.amount, input.currencyCode, "MONTH", t),
          }),
        ]),
    t("subs.registered.selection", { mode: modeLabel(input.mode, t) }),
    t("subs.registered.status"),
    t("subs.registered.noPayment"),
    t("subs.registered.noOrder"),
    t("subs.registered.notActive"),
  ];
  if (input.mode === "SURPRISE") {
    lines.push(t("subs.registered.noFragrance"));
  } else if (input.fragranceNames.length) {
    lines.push(
      t("subs.registered.fragrances", {
        names: input.fragranceNames.join(t("subs.registered.listSeparator")),
      }),
    );
  }
  return lines;
}

export function assertNoBillingCopy(text: string): void {
  const lower = text.toLowerCase();
  const hit = FORBIDDEN_COPY.find((phrase) => lower.includes(phrase));
  if (hit) throw new Error(`Unexpected billing copy: ${hit}`);
}
