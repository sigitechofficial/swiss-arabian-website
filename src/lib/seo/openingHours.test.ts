import { describe, expect, it } from "vitest";
import { openingHoursSpecification } from "./openingHours";

const spec = (dayOfWeek: string[], opens: string, closes: string) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek,
  opens,
  closes,
});

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

describe("openingHoursSpecification", () => {
  it("reads day ranges and 12-hour times as shown on the store list", () => {
    expect(
      openingHoursSpecification("Mon–Sat 10:00 AM–10:00 PM · Sun 10:00 AM–12:00 AM"),
    ).toEqual([spec(WEEK.slice(0, 6), "10:00", "22:00"), spec(["Sunday"], "10:00", "00:00")]);
  });

  it("reads 24-hour times, 'daily' and ranges that wrap past Sunday", () => {
    expect(openingHoursSpecification("Daily 09:30-23:00")).toEqual([spec(WEEK, "09:30", "23:00")]);
    expect(openingHoursSpecification("Sat to Mon 10 am to 10 pm")).toEqual([
      spec(["Saturday", "Sunday", "Monday"], "10:00", "22:00"),
    ]);
  });

  it("returns null when any part cannot be read exactly", () => {
    expect(openingHoursSpecification(undefined)).toBeNull();
    expect(openingHoursSpecification("")).toBeNull();
    expect(openingHoursSpecification("Open late")).toBeNull();
    expect(openingHoursSpecification("Mon–Fri 10:00 AM–10:00 PM · Holidays vary")).toBeNull();
    expect(openingHoursSpecification("Mon 13:00 PM–2:00 PM")).toBeNull();
  });
});
