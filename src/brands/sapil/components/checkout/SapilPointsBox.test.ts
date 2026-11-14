import { describe, expect, it } from "vitest";
import { formatMessage } from "@/lib/i18n/messages";
import enCheckout from "../../i18n/messages/en/checkout.json";
import arCheckout from "../../i18n/messages/ar/checkout.json";
import { ENGLISH } from "../../i18n/catalog";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import { pointsReasonText } from "./SapilPointsBox";

const messages = Object.fromEntries(
  Object.entries(ENGLISH).flatMap(([area, entries]) => Object.entries(entries).map(([k, v]) => [`${area}.${k}`, v])),
);
const t: SapilTranslator = (key, values) => formatMessage("en", messages as never, key, values);

describe("pointsReasonText", () => {
  it("turns backend reason codes into shopper copy", () => {
    expect(pointsReasonText(t, "INSUFFICIENT_POINTS")).toBe("You don’t have enough points.");
    expect(pointsReasonText(t, " below_minimum ")).toBe("Enter at least the minimum number of points.");
  });

  it("returns null for unknown or empty codes, so the caller can fall back", () => {
    expect(pointsReasonText(t, "SOMETHING_NEW")).toBeNull();
    expect(pointsReasonText(t, null)).toBeNull();
  });

  it("has every points message in English and Arabic", () => {
    const en = Object.keys(enCheckout).filter((key) => key.startsWith("points"));
    const ar = Object.keys(arCheckout).filter((key) => key.startsWith("points"));
    expect(en.length).toBeGreaterThan(10);
    expect(ar.sort()).toEqual(en.sort());
  });
});
