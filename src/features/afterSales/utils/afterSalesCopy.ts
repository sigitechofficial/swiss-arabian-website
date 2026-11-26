import { formatMoney } from "@/lib/format/money";
import { intlLocale } from "@/lib/i18n/locales";
import {
  englishTranslator,
  type MessageKey,
  type MessageValues,
  type Translator,
} from "@/lib/i18n/messages";
import type { AfterSalesCopyItem } from "../types/afterSales";
import { afterSalesOptionLabel } from "./eligibility";

/** Message key for a backend copy item: `returnsPolicy.<KEY>.<VARIANT>`. */
export function afterSalesCopyKey(item: Pick<AfterSalesCopyItem, "key" | "variant">): MessageKey {
  return `returnsPolicy.${item.key}.${item.variant}` as MessageKey;
}

/** "a, b or c" in the page's language. */
export function joinAlternatives(parts: string[], locale: string): string {
  if (parts.length <= 1) return parts.join("");
  try {
    return new Intl.ListFormat(intlLocale(locale), {
      style: "long",
      type: "disjunction",
    }).format(parts);
  } catch {
    return `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}`;
  }
}

/** Placeholders a copy sentence can use: {count} (days or minutes), {money}, {percent}, {points}, {reasons}. */
export function afterSalesCopyValues(
  item: AfterSalesCopyItem,
  t: Translator,
  locale: string,
): MessageValues {
  const values: MessageValues = {};
  const raw = item.values ?? {};
  if (raw.days != null) values.count = Number(raw.days);
  if (raw.minutes != null) values.count = Number(raw.minutes);
  if (raw.amount != null) {
    values.money = formatMoney(Number(raw.amount), String(raw.currencyCode || "AED"));
  }
  if (raw.percent != null) values.percent = String(raw.percent);
  if (raw.points != null) values.points = String(raw.points);
  if (item.reasonCodes?.length) {
    values.reasons = joinAlternatives(
      item.reasonCodes.map((code) => afterSalesOptionLabel("returnReason", code, t)),
      locale,
    );
  }
  return values;
}

/**
 * A backend after-sales sentence in the page's language. Wording the site does
 * not know yet (a new key or variant) shows the backend's English text.
 */
export function afterSalesCopyText(
  item: AfterSalesCopyItem,
  t: Translator = englishTranslator,
  locale = "en",
): string {
  const key = afterSalesCopyKey(item);
  const text = t(key, afterSalesCopyValues(item, t, locale));
  return text === key ? item.text : text;
}
