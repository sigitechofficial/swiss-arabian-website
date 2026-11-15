import type { TabbyPrescore } from "../hooks/useTabbyPrescore";
import type { PaymentMethodOption } from "../types/checkout";
import { isStripePaymentMethod, paymentMethodNote, upcomingPaymentMethods } from "./methodLabels";
import { isTabbyPaymentMethod, tabbySnippetConfig, type TabbyLang } from "./tabby";

/** Where the card / wallet form for an option opens inside checkout. */
export type PaymentSurface = "card" | "apple_pay" | "google_pay";

export type PayMark = "visa" | "mc" | "amex";

/**
 * One payment choice as the shopper sees it. Stripe and Paymob each expand into
 * their surfaces (wallets, card); every other zone method is one row.
 * `kind` lets each brand word the row itself; `title`/`sub` are Swiss Arabian's wording.
 */
export type PayRow = {
  key: string;
  kind: "apple_pay" | "google_pay" | "card" | "method" | "upcoming";
  title: string;
  sub?: string;
  marks?: PayMark[];
  wallet?: "apple" | "google";
  badge?: string;
  disabled?: boolean;
  zoneId?: string;
  /** The zone payment method behind the row (absent for "coming soon" rows). */
  method?: PaymentMethodOption;
  surface?: PaymentSurface;
  provider?: "stripe" | "paymob";
  /** Tabby row: snippet settings from the backend (`false` when they are missing). */
  tabby?: ReturnType<typeof tabbySnippetConfig> | false;
  /** Tabby row: pre-scoring state for this shopper. */
  tabbyState?: TabbyPrescore["state"];
  /** Tabby's own rejection message, in the page's language. */
  tabbyMessage?: string;
};

export type PayGroup = { id: "stripe" | "paymob" | "other" | "more"; title: string | null; rows: PayRow[] };

export function paymentGroups(
  methods: PaymentMethodOption[],
  countryCode: string | null | undefined,
  tabbyPrescore: TabbyPrescore,
  tabbyLang: TabbyLang,
): PayGroup[] {
  const country = (countryCode || "AE").toUpperCase();
  const stripeFirst = !["SA", "EG", "PK"].includes(country);
  const stripe = methods.find((method) => isStripePaymentMethod(method));
  const paymob = methods.find((method) => method.providerCode?.toLowerCase() === "paymob");
  const used = new Set([stripe?.zonePaymentMethodId, paymob?.zonePaymentMethodId].filter(Boolean));
  const groups: PayGroup[] = [];

  const stripeGroup: PayGroup | null = stripe
    ? {
        id: "stripe",
        title: "Stripe",
        rows: [
          {
            key: "apple_pay@stripe",
            kind: "apple_pay",
            title: "Apple Pay",
            wallet: "apple",
            zoneId: stripe.zonePaymentMethodId,
            method: stripe,
            surface: "apple_pay",
            provider: "stripe",
          },
          {
            key: "google_pay@stripe",
            kind: "google_pay",
            title: "Google Pay",
            wallet: "google",
            zoneId: stripe.zonePaymentMethodId,
            method: stripe,
            surface: "google_pay",
            provider: "stripe",
          },
          {
            key: "card@stripe",
            kind: "card",
            title: "Credit or debit card",
            sub: "Visa, Mastercard, Amex",
            marks: ["visa", "mc", "amex"],
            zoneId: stripe.zonePaymentMethodId,
            method: stripe,
            surface: "card",
            provider: "stripe",
          },
        ],
      }
    : null;
  const paymobGroup: PayGroup | null = paymob
    ? {
        id: "paymob",
        title: "Paymob",
        rows: [
          {
            key: "card@paymob",
            kind: "card",
            title: "Credit or debit card",
            sub: "Visa, Mastercard",
            marks: ["visa", "mc"],
            zoneId: paymob.zonePaymentMethodId,
            method: paymob,
            surface: "card",
            provider: "paymob",
          },
        ],
      }
    : null;

  for (const group of stripeFirst ? [stripeGroup, paymobGroup] : [paymobGroup, stripeGroup]) {
    if (group) groups.push(group);
  }

  const others = methods.filter((method) => !used.has(method.zonePaymentMethodId));
  if (others.length) {
    groups.push({
      id: "other",
      title: "Other",
      rows: others.map((method) => {
        const row: PayRow = {
          key: method.zonePaymentMethodId,
          kind: "method",
          title: method.displayName,
          sub: paymentMethodNote(method) || undefined,
          zoneId: method.zonePaymentMethodId,
          method,
        };
        if (!isTabbyPaymentMethod(method)) return row;
        // Tabby: their mark, and their own wording when they can't approve this shopper.
        row.tabby = tabbySnippetConfig(method) ?? false;
        row.tabbyState = tabbyPrescore.state;
        if (tabbyPrescore.state === "rejected") {
          row.disabled = true;
          row.sub = tabbyPrescore.message[tabbyLang];
          row.tabbyMessage = tabbyPrescore.message[tabbyLang];
        } else if (tabbyPrescore.state === "checking") {
          row.sub = "Checking eligibility…";
        }
        return row;
      }),
    });
  }

  const more = (methods.length ? upcomingPaymentMethods(countryCode, methods) : []).filter(
    (method) =>
      method.selectsProvider !== "stripe" && method.id !== "paymob-apple-pay" && method.id !== "paymob-google-pay",
  );
  if (more.length) {
    groups.push({
      id: "more",
      title: "More ways to pay",
      rows: more.map((method) => ({
        key: method.id,
        kind: "upcoming",
        title: method.title,
        sub: method.note,
        badge: "Coming soon",
        disabled: true,
      })),
    });
  }

  return groups;
}

export function defaultRowKey(method: PaymentMethodOption): string {
  if (isStripePaymentMethod(method)) return "card@stripe";
  if (method.providerCode?.toLowerCase() === "paymob") return "card@paymob";
  return method.zonePaymentMethodId;
}
