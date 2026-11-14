import type { RegularPeriod, SpecialHours, StoreCard, StoreDay } from "../types";

/**
 * Opening hours in the store's own time zone: today's hours, "open now",
 * when it closes / opens next, and the coming week (special dates such as
 * Ramadan, Eid and public holidays replace the weekly hours).
 * Pure functions: callers pass `now` (pages work it out in the browser).
 */

export const STORE_DAYS: readonly StoreDay[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type Period = { open: string; close: string };
export type DayHours = {
  date: string;
  day: StoreDay;
  closed: boolean;
  periods: Period[];
  /** Holiday / season name when special hours apply. */
  label?: string;
  special: boolean;
};

export type OpenStatus =
  | { kind: "open"; closesAt: string; closesSoon: boolean }
  | { kind: "closed"; opensAt: string; opensOn: "today" | "tomorrow" | StoreDay }
  | { kind: "closedToday" }
  | { kind: "temporarilyClosed" }
  | { kind: "closedForGood" }
  | { kind: "openingSoon" }
  /** No hours on record: the page shows none rather than guessing. */
  | { kind: "unknown" };

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** End of a period in minutes from the start of its day (past midnight → more than 1440). */
const periodEnd = (p: Period) => {
  const start = minutes(p.open);
  const end = minutes(p.close === "24:00" ? "00:00" : p.close);
  return end <= start ? end + 1440 : end;
};

/** Date, weekday and minutes since midnight in the store's time zone. */
export function zonedNow(timeZone: string, now: Date): { date: string; day: StoreDay; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return zonedNow("UTC", now);
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = get("weekday").slice(0, 3).toUpperCase() as StoreDay;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    day: STORE_DAYS.includes(day) ? day : "MON",
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** "2027-03-01" + n days (calendar arithmetic, no time zone). */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const dayAfter = (day: StoreDay, n: number) => STORE_DAYS[(STORE_DAYS.indexOf(day) + n) % 7]!;

function specialFor(special: SpecialHours[], date: string): SpecialHours | undefined {
  return special.find((s) => s.date <= date && (s.endDate ?? s.date) >= date);
}

/** Hours on one date: special hours win over the weekly hours. */
export function hoursOn(
  store: Pick<StoreCard, "regularHours" | "specialHours">,
  date: string,
  day: StoreDay,
): DayHours {
  const special = specialFor(store.specialHours ?? [], date);
  if (special) {
    if (special.closed || !special.open || !special.close) {
      return { date, day, closed: true, periods: [], label: special.label, special: true };
    }
    return { date, day, closed: false, periods: [{ open: special.open, close: special.close }], label: special.label, special: true };
  }
  const periods = (store.regularHours ?? [])
    .filter((p: RegularPeriod) => p.day === day)
    .map(({ open, close }) => ({ open, close }))
    .sort((a, b) => minutes(a.open) - minutes(b.open));
  return { date, day, closed: periods.length === 0, periods, special: false };
}

/** Today and the next six days, starting with today (in the store's time zone). */
export function weekAhead(store: Pick<StoreCard, "regularHours" | "specialHours" | "timeZone">, now: Date): DayHours[] {
  const today = zonedNow(store.timeZone, now);
  return Array.from({ length: 7 }, (_, i) => hoursOn(store, addDays(today.date, i), dayAfter(today.day, i)));
}

export function hasHours(store: Pick<StoreCard, "regularHours" | "specialHours">): boolean {
  return (store.regularHours?.length ?? 0) > 0;
}

/** Is the shop open right now, and when does that change? */
export function openStatus(
  store: Pick<StoreCard, "regularHours" | "specialHours" | "timeZone" | "openState">,
  now: Date,
): OpenStatus {
  if (store.openState === "CLOSED_PERMANENTLY") return { kind: "closedForGood" };
  if (store.openState === "CLOSED_TEMPORARILY") return { kind: "temporarilyClosed" };
  if (store.openState === "OPENING_SOON") return { kind: "openingSoon" };
  if (!hasHours(store)) return { kind: "unknown" };

  const here = zonedNow(store.timeZone, now);
  const yesterday = hoursOn(store, addDays(here.date, -1), dayAfter(here.day, 6));
  const today = hoursOn(store, here.date, here.day);

  // A period from yesterday that runs past midnight.
  for (const p of yesterday.periods) {
    const end = periodEnd(p);
    if (end > 1440 && here.minutes < end - 1440) {
      return { kind: "open", closesAt: p.close, closesSoon: end - 1440 - here.minutes <= 60 };
    }
  }
  for (const p of today.periods) {
    const start = minutes(p.open);
    const end = periodEnd(p);
    if (here.minutes >= start && here.minutes < end) {
      return { kind: "open", closesAt: p.close, closesSoon: end - here.minutes <= 60 };
    }
  }
  const later = today.periods.find((p) => minutes(p.open) > here.minutes);
  if (later) return { kind: "closed", opensAt: later.open, opensOn: "today" };
  for (let i = 1; i <= 7; i++) {
    const next = hoursOn(store, addDays(here.date, i), dayAfter(here.day, i));
    if (next.periods.length) {
      return { kind: "closed", opensAt: next.periods[0]!.open, opensOn: i === 1 ? "tomorrow" : next.day };
    }
  }
  return { kind: "closedToday" };
}

/** "22:00" → "10:00 PM" / "10:00 م" (midnight shown as 12:00 AM). */
export function formatTime(time: string, intlLocale: string): string {
  const [h, m] = (time === "24:00" ? "00:00" : time).split(":").map(Number);
  try {
    return new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(
      new Date(Date.UTC(2000, 0, 1, h ?? 0, m ?? 0)),
    );
  } catch {
    return time;
  }
}

/** Weekday name for a store day ("MON" → "Monday" / "الاثنين"). */
export function dayName(day: StoreDay, intlLocale: string, width: "long" | "short" = "long"): string {
  // 2024-01-01 was a Monday.
  const date = new Date(Date.UTC(2024, 0, 1 + STORE_DAYS.indexOf(day), 12));
  try {
    return new Intl.DateTimeFormat(intlLocale, { weekday: width, timeZone: "UTC" }).format(date);
  } catch {
    return day;
  }
}

/**
 * schema.org openingHoursSpecification from the weekly hours. Periods past
 * midnight keep their real closing time (schema.org allows closes < opens).
 */
export function openingHoursSpecification(store: Pick<StoreCard, "regularHours" | "specialHours">) {
  const names: Record<StoreDay, string> = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday",
  };
  const regular = (store.regularHours ?? []).map((p) => ({
    "@type": "OpeningHoursSpecification" as const,
    dayOfWeek: names[p.day],
    opens: p.open,
    closes: p.close === "24:00" ? "23:59" : p.close,
  }));
  const special = (store.specialHours ?? []).map((s) => ({
    "@type": "OpeningHoursSpecification" as const,
    validFrom: s.date,
    validThrough: s.endDate ?? s.date,
    ...(s.closed || !s.open || !s.close ? { opens: "00:00", closes: "00:00" } : { opens: s.open, closes: s.close }),
  }));
  return [...regular, ...special];
}
