import { describe, expect, it } from "vitest";
import { reviewDate } from "@/features/catalog/utils/pdpReviews";
import { formatMarketDate } from "./marketDate";

describe("formatMarketDate", () => {
  it("prints the day of the market's time zone, whatever the device's zone", () => {
    // 17 Mar 2026 20:30 UTC is already 18 Mar in Dubai and Karachi.
    const iso = "2026-03-17T20:30:00Z";
    const options = { day: "numeric", month: "short", year: "numeric" } as const;
    expect(formatMarketDate(iso, "en-GB", "Asia/Dubai", options)).toBe("18 Mar 2026");
    expect(formatMarketDate(iso, "en-GB", "UTC", options)).toBe("17 Mar 2026");
  });

  it("is empty for a missing or broken date", () => {
    const options = { year: "numeric" } as const;
    expect(formatMarketDate(null, "en-GB", "Asia/Dubai", options)).toBe("");
    expect(formatMarketDate("", "en-GB", "Asia/Dubai", options)).toBe("");
    expect(formatMarketDate("not a date", "en-GB", "Asia/Dubai", options)).toBe("");
  });

  it("accepts a Date", () => {
    expect(
      formatMarketDate(new Date("2026-11-16T10:00:00Z"), "en-GB", "Asia/Riyadh", { hour: "2-digit", hour12: false }),
    ).toBe("13");
  });
});

describe("product review dates (React error #418)", () => {
  it("are the same on the server and in the browser: both use the market's zone", () => {
    const createdAt = "2026-03-17T20:30:00Z";
    const server = reviewDate(createdAt, "en-GB", "Asia/Dubai");
    const browser = reviewDate(createdAt, "en-GB", "Asia/Dubai");
    expect(server).toBe("18 Mar 2026");
    expect(browser).toBe(server);
  });
});
