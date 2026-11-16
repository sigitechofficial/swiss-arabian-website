import type { Translator } from "@/lib/i18n/messages";
import type { StoreCard } from "../types";
import { dayName, formatTime, openStatus, type DayHours, type OpenStatus } from "./openingHours";

export type StatusTone = "open" | "warn" | "closed" | "muted";

/** "Open now · Closes 10:00 PM", "Opens tomorrow 10:00 AM" … in the page's language. */
export function openStatusText(
  status: OpenStatus,
  t: Translator,
  intlLocale: string,
): { text: string; detail: string | null; tone: StatusTone } | null {
  const time = (v: string) => formatTime(v, intlLocale);
  switch (status.kind) {
    case "open":
      return {
        text: t("stores.status.open"),
        detail: status.closesSoon ? t("stores.status.closesSoon", { time: time(status.closesAt) }) : t("stores.status.closesAt", { time: time(status.closesAt) }),
        tone: status.closesSoon ? "warn" : "open",
      };
    case "closed":
      return {
        text: t("stores.status.closed"),
        detail:
          status.opensOn === "today"
            ? t("stores.status.opensToday", { time: time(status.opensAt) })
            : status.opensOn === "tomorrow"
              ? t("stores.status.opensTomorrow", { time: time(status.opensAt) })
              : t("stores.status.opensOn", { day: dayName(status.opensOn, intlLocale), time: time(status.opensAt) }),
        tone: "closed",
      };
    case "closedToday":
      return { text: t("stores.status.closedToday"), detail: null, tone: "closed" };
    case "temporarilyClosed":
      return { text: t("stores.status.temporarilyClosed"), detail: null, tone: "warn" };
    case "closedForGood":
      return { text: t("stores.status.closedForGood"), detail: null, tone: "closed" };
    case "openingSoon":
      return { text: t("stores.status.openingSoon"), detail: null, tone: "muted" };
    default:
      return null;
  }
}

/** Status of one store at `now`, or null before the browser knows the time. */
export function storeStatusText(store: StoreCard, now: Date | null, t: Translator, intlLocale: string) {
  return now ? openStatusText(openStatus(store, now), t, intlLocale) : null;
}

/** "10:00 AM – 10:00 PM, 4:00 PM – 1:00 AM" or "Closed". */
export function dayHoursText(day: DayHours, t: Translator, intlLocale: string): string {
  if (day.closed) return t("stores.closedDay");
  return day.periods
    .map((p) => t("stores.timeRange", { open: formatTime(p.open, intlLocale), close: formatTime(p.close, intlLocale) }))
    .join(", ");
}
