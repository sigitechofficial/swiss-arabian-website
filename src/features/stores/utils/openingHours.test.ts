import { describe, expect, it } from "vitest";
import type { StoreCard } from "../types";
import { addDays, dayName, formatTime, hoursOn, openStatus, openingHoursSpecification, weekAhead, zonedNow } from "./openingHours";

type HoursStore = Pick<StoreCard, "regularHours" | "specialHours" | "timeZone" | "openState">;
const week = (open: string, close: string) =>
  (["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const).map((day) => ({ day, open, close }));
const store = (over: Partial<HoursStore> = {}): HoursStore => ({
  regularHours: week("10:00", "22:00"),
  specialHours: [],
  timeZone: "Asia/Dubai",
  openState: "OPEN",
  ...over,
});
/** A moment given as Dubai local time (UTC+4). */
const dubai = (iso: string) => new Date(`${iso}+04:00`);

describe("time zone", () => {
  it("reads date, weekday and minutes in the store's zone", () => {
    // 2027-03-01 is a Monday; 23:30 UTC on Sunday is 03:30 Monday in Dubai.
    expect(zonedNow("Asia/Dubai", new Date("2027-02-28T23:30:00Z"))).toEqual({ date: "2027-03-01", day: "MON", minutes: 210 });
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });
});

describe("open now", () => {
  it("open during hours, closes soon in the last hour", () => {
    expect(openStatus(store(), dubai("2027-03-01T12:00:00"))).toEqual({ kind: "open", closesAt: "22:00", closesSoon: false });
    expect(openStatus(store(), dubai("2027-03-01T21:15:00"))).toEqual({ kind: "open", closesAt: "22:00", closesSoon: true });
  });

  it("before opening: opens today; after closing: opens tomorrow", () => {
    expect(openStatus(store(), dubai("2027-03-01T08:00:00"))).toEqual({ kind: "closed", opensAt: "10:00", opensOn: "today" });
    expect(openStatus(store(), dubai("2027-03-01T22:30:00"))).toEqual({ kind: "closed", opensAt: "10:00", opensOn: "tomorrow" });
  });

  it("hours past midnight stay open after midnight (from yesterday's period)", () => {
    const late = store({ regularHours: week("10:00", "01:00") });
    expect(openStatus(late, dubai("2027-03-02T00:30:00"))).toEqual({ kind: "open", closesAt: "01:00", closesSoon: true });
    expect(openStatus(late, dubai("2027-03-02T01:30:00"))).toEqual({ kind: "closed", opensAt: "10:00", opensOn: "today" });
    // Closing at midnight written as 00:00 or 24:00.
    expect(openStatus(store({ regularHours: week("10:00", "00:00") }), dubai("2027-03-01T23:30:00")).kind).toBe("open");
    expect(openStatus(store({ regularHours: week("10:00", "24:00") }), dubai("2027-03-01T23:30:00")).kind).toBe("open");
  });

  it("skips closed days to the next opening", () => {
    const weekdays = store({ regularHours: week("10:00", "22:00").filter((p) => p.day !== "FRI" && p.day !== "SAT") });
    // Friday 2027-03-05 evening → next opening Sunday.
    expect(openStatus(weekdays, dubai("2027-03-05T23:00:00"))).toEqual({ kind: "closed", opensAt: "10:00", opensOn: "SUN" });
  });

  it("special hours (Ramadan, Eid) replace the weekly hours", () => {
    const ramadan = store({
      specialHours: [
        { date: "2027-02-08", endDate: "2027-03-09", open: "13:00", close: "02:00", label: "Ramadan" },
        { date: "2027-03-10", closed: true, label: "Eid" },
      ],
    });
    expect(openStatus(ramadan, dubai("2027-03-01T11:00:00"))).toEqual({ kind: "closed", opensAt: "13:00", opensOn: "today" });
    expect(openStatus(ramadan, dubai("2027-03-02T01:00:00")).kind).toBe("open");
    expect(hoursOn(ramadan, "2027-03-10", "WED")).toMatchObject({ closed: true, label: "Eid", special: true });
    expect(openStatus(ramadan, dubai("2027-03-10T12:00:00"))).toEqual({ kind: "closed", opensAt: "10:00", opensOn: "tomorrow" });
  });

  it("shop states and missing hours", () => {
    expect(openStatus(store({ openState: "CLOSED_TEMPORARILY" }), new Date()).kind).toBe("temporarilyClosed");
    expect(openStatus(store({ openState: "CLOSED_PERMANENTLY" }), new Date()).kind).toBe("closedForGood");
    expect(openStatus(store({ openState: "OPENING_SOON" }), new Date()).kind).toBe("openingSoon");
    expect(openStatus(store({ regularHours: [] }), new Date()).kind).toBe("unknown");
  });
});

describe("week ahead and formatting", () => {
  it("starts today, marks special days", () => {
    const days = weekAhead(store({ specialHours: [{ date: "2027-03-03", closed: true, label: "Holiday" }] }), dubai("2027-03-01T09:00:00"));
    expect(days.map((d) => d.day)).toEqual(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
    expect(days[2]).toMatchObject({ date: "2027-03-03", closed: true, label: "Holiday" });
  });

  it("formats times and day names per language", () => {
    expect(formatTime("22:00", "en-AE")).toMatch(/10:00\s?PM/i);
    expect(formatTime("24:00", "en-AE")).toMatch(/12:00\s?AM/i);
    expect(dayName("MON", "en-AE")).toBe("Monday");
    expect(dayName("FRI", "ar-AE")).toBe("الجمعة");
  });

  it("schema.org hours keep past-midnight closing and mark closed special days", () => {
    const spec = openingHoursSpecification({
      regularHours: [{ day: "SUN", open: "10:00", close: "24:00" }],
      specialHours: [{ date: "2027-03-10", closed: true }],
    });
    expect(spec).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:00", closes: "23:59" },
      { "@type": "OpeningHoursSpecification", validFrom: "2027-03-10", validThrough: "2027-03-10", opens: "00:00", closes: "00:00" },
    ]);
  });
});
