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

export const SCHEDULE_UNAVAILABLE_MESSAGE =
  "No published Surprise schedule is available for this audience. Surprise registration stays closed until one is published.";

export function isSubscriptionAudience(value: unknown): value is SubscriptionAudience {
  return value === "MEN" || value === "WOMEN";
}

export function audienceLabel(audience: SubscriptionAudience | null | undefined): string {
  if (audience === "MEN") return "Men";
  if (audience === "WOMEN") return "Women";
  return "No audience is saved on this agreement.";
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

export function audienceChangeNotice(removed: number): string | null {
  if (removed < 1) return null;
  const picks = removed === 1 ? "pick was" : "picks were";
  return `${removed} ${picks} removed because they are not available for this audience.`;
}

/**
 * Pinned schedule copy only. A hash-pool preview is not shown as a fragrance.
 * Month SKUs beyond the provisional next one stay hidden.
 */
export function surpriseAccountNote(input: {
  schedulePinned: boolean;
  previewSource?: "SCHEDULE" | "PROVISIONAL_POOL" | null;
  previewSku?: string | null;
}): string {
  const pinned = input.schedulePinned || input.previewSource === "SCHEDULE";
  if (!pinned) {
    return "No published schedule is pinned. No fragrance is allocated and no shipment is promised.";
  }
  const sku =
    input.previewSource === "SCHEDULE" && input.previewSku
      ? ` Provisional fragrance ${input.previewSku} is not allocated.`
      : "";
  return `A published schedule is pinned.${sku} This is provisional and not a shipment.`;
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

export function planFeeLabel(amount: string, currencyCode: string, intervalUnit: string): string {
  const cadence = intervalUnit === "MONTH" ? "month" : intervalUnit.toLowerCase();
  return `${currencyCode} ${amount} / ${cadence}`;
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
export function subscriptionPriceLines(input: {
  amount?: string | null;
  currencyCode?: string | null;
  shippingMode?: string | null;
  shippingAmount?: string | null;
  monthlyTotal?: string | null;
}): SubscriptionPriceLines {
  const currency = input.currencyCode?.trim().toUpperCase() ?? "";
  const amount = input.amount?.trim() ?? "";
  if (!currency || !MONEY.test(amount)) {
    return { available: false, message: "Subscription pricing is unavailable." };
  }
  const mode = input.shippingMode === "EXTRA_FIXED" ? "EXTRA_FIXED" : input.shippingMode ?? "INCLUDED";
  const shippingAmount = input.shippingAmount?.trim() || "0.00";
  const serverTotal = input.monthlyTotal?.trim() ?? "";
  const includedZero =
    mode === "INCLUDED" && (input.shippingAmount == null || shippingAmount === "0.00" || shippingAmount === "0");
  if (mode !== "INCLUDED" && mode !== "EXTRA_FIXED") {
    return { available: false, message: "Subscription pricing is unavailable." };
  }
  if (mode === "EXTRA_FIXED" && !MONEY.test(shippingAmount)) {
    return { available: false, message: "Subscription pricing is unavailable." };
  }
  if (MONEY.test(serverTotal)) {
    return {
      available: true,
      subscription: `Subscription ${currency} ${amount}/month`,
      shipping: mode === "EXTRA_FIXED" ? `Shipping ${currency} ${shippingAmount}/month` : "Shipping included",
      total: `Total ${currency} ${serverTotal}/month`,
      totalAmount: serverTotal,
    };
  }
  if (includedZero) {
    return {
      available: true,
      subscription: `Subscription ${currency} ${amount}/month`,
      shipping: "Shipping included",
      total: `Total ${currency} ${amount}/month`,
      totalAmount: amount,
    };
  }
  return { available: false, message: "Subscription pricing is unavailable." };
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
    throw new Error("That fragrance is not on this plan.");
  }
  if (mode === "SURPRISE") return [];
  if (mode === "REPLENISHMENT") return [variantId];
  if (selected.includes(variantId)) return selected;
  if (selected.length >= QUEUE_CLIENT_LIMIT) {
    throw new Error("A queue can hold 12 fragrances.");
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
    throw new Error("Choose Men or Women.");
  }
  const allowed = new Set(input.allowedVariantIds);
  const ordered = input.variantIds.filter((id, index) => input.variantIds.indexOf(id) === index);
  if (input.mode !== "SURPRISE" && ordered.some((id) => !allowed.has(id))) {
    throw new Error("That fragrance is not on this plan.");
  }
  if (input.mode === "REPLENISHMENT" && ordered.length !== 1) {
    throw new Error("Choose one fragrance.");
  }
  if (input.mode === "QUEUE" && ordered.length < 1) {
    throw new Error("Add at least one fragrance.");
  }
  if (input.mode === "QUEUE" && ordered.length > QUEUE_CLIENT_LIMIT) {
    throw new Error("A queue can hold 12 fragrances.");
  }
  if (input.mode === "SURPRISE" && ordered.length > 0) {
    throw new Error("Surprise Me does not take a fragrance list.");
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

export function statusLabel(status: string): string {
  if (status === "PENDING_ACTIVATION") return "Pending activation";
  if (status === "ACTIVE") return "Active";
  if (status === "PAUSED") return "Paused";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

export function modeLabel(mode: SubscriptionSelectionMode): string {
  if (mode === "REPLENISHMENT") return "Replenishment";
  if (mode === "QUEUE") return "Queue";
  return "Surprise Me";
}

const FORBIDDEN_COPY = [
  "payment successful",
  "order confirmed",
  "delivery confirmed",
  "next charge",
  "automatically renews",
  "active subscription",
];

export function registrationSuccessCopy(input: {
  planName: string;
  amount: string;
  currencyCode: string;
  shippingMode?: string | null;
  shippingAmount?: string | null;
  monthlyTotal?: string | null;
  mode: SubscriptionSelectionMode;
  fragranceNames: string[];
}): string[] {
  const price = subscriptionPriceLines(input);
  const lines = [
    "Registration saved.",
    ...(price.available
      ? [`${input.planName}.`, price.subscription, price.shipping, price.total]
      : [`${input.planName} — ${planFeeLabel(input.amount, input.currencyCode, "MONTH")}.`]),
    `Selection: ${modeLabel(input.mode)}.`,
    "Status: Pending activation.",
    "No payment has been collected.",
    "No order has been created.",
    "This subscription is not active and does not renew.",
  ];
  if (input.mode === "SURPRISE") {
    lines.push("No fragrance has been allocated.");
  } else if (input.fragranceNames.length) {
    lines.push(`Saved fragrances: ${input.fragranceNames.join(", ")}.`);
  }
  return lines;
}

export function assertNoBillingCopy(text: string): void {
  const lower = text.toLowerCase();
  const hit = FORBIDDEN_COPY.find((phrase) => lower.includes(phrase));
  if (hit) throw new Error(`Unexpected billing copy: ${hit}`);
}
