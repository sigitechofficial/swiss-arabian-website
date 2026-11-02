import { describe, expect, it } from "vitest";

import type { PlanProduct } from "../types/subscription.types";
import {
  assertNoBillingCopy,
  buildRegisterBody,
  moveVariant,
  planFeeLabel,
  subscriptionPriceLines,
  registrationFingerprint,
  registrationIdempotencyKey,
  registrationSuccessCopy,
  replaceRegistrationIdempotencyKey,
  retainAudienceSelections,
  audienceChangeNotice,
  searchPlanProducts,
  activeRegistrationConsent,
  selectableProducts,
  selectVariant,
  surpriseAccountNote,
} from "./subscriptionRules";

const products: PlanProduct[] = [
  { variantId: "v-cheap", productId: "p1", sku: "LOW", name: "Low" },
  { variantId: "v-high", productId: "p2", sku: "HIGH", name: "Above the plan fee" },
];

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("subscription rules", () => {
  it("shows the fixed monthly fee exactly", () => {
    expect(planFeeLabel("65.00", "AED", "MONTH")).toBe("AED 65.00 / month");
    expect(planFeeLabel("150.00", "AED", "MONTH")).not.toContain("1449");
  });

  it("shows included shipping from the server monthly total", () => {
    const lines = subscriptionPriceLines({
      amount: "65.00",
      currencyCode: "AED",
      shippingMode: "INCLUDED",
      shippingAmount: "0.00",
      monthlyTotal: "65.00",
    });
    expect(lines).toMatchObject({
      available: true,
      subscription: "Subscription AED 65.00/month",
      shipping: "Shipping included",
      total: "Total AED 65.00/month",
      totalAmount: "65.00",
    });
  });

  it("shows extra shipping without adding the amounts itself", () => {
    const lines = subscriptionPriceLines({
      amount: "65.00",
      currencyCode: "AED",
      shippingMode: "EXTRA_FIXED",
      shippingAmount: "10.00",
      monthlyTotal: "75.00",
    });
    expect(lines).toMatchObject({
      available: true,
      shipping: "Shipping AED 10.00/month",
      total: "Total AED 75.00/month",
      totalAmount: "75.00",
    });
  });

  it("falls back only when shipping is included and zero", () => {
    expect(
      subscriptionPriceLines({ amount: "65.00", currencyCode: "AED" }).available,
    ).toBe(true);
    expect(
      subscriptionPriceLines({
        amount: "65.00",
        currencyCode: "AED",
        shippingMode: "EXTRA_FIXED",
        shippingAmount: "10.00",
      }),
    ).toMatchObject({ available: false });
  });

  it("does not send prices on a registration body", () => {
    const body = buildRegisterBody({
      zoneCode: "UAE",
      planCode: "MONTHLY_65",
      mode: "QUEUE",
      audience: "MEN",
      variantIds: ["v-cheap"],
      customerAddressId: "addr",
      consentTextVersion: "from-legal",
      allowedVariantIds: ["v-cheap", "v-high"],
    });
    expect(body).not.toHaveProperty("amount");
    expect(body).not.toHaveProperty("shippingAmount");
    expect(body).not.toHaveProperty("monthlyTotal");
  });

  it("keeps variants above the plan fee", () => {
    const rows = selectableProducts([
      { ...products[0], retailPrice: 40 },
      { ...products[1], retailPrice: 1449.9 },
    ]);
    expect(rows.map((row) => row.variantId)).toEqual(["v-cheap", "v-high"]);
  });

  it("searches only the approved set", () => {
    expect(searchPlanProducts(products, "above").map((row) => row.sku)).toEqual(["HIGH"]);
  });

  it("replenishment keeps one variant", () => {
    const allowed = new Set(products.map((row) => row.variantId));
    const first = selectVariant("REPLENISHMENT", [], "v-high", allowed);
    expect(selectVariant("REPLENISHMENT", first, "v-cheap", allowed)).toEqual(["v-cheap"]);
  });

  it("queue preserves order and ignores a duplicate", () => {
    const allowed = new Set(["a", "b", "c"]);
    let selected = selectVariant("QUEUE", [], "b", allowed);
    selected = selectVariant("QUEUE", selected, "a", allowed);
    selected = selectVariant("QUEUE", selected, "b", allowed);
    expect(selected).toEqual(["b", "a"]);
    expect(moveVariant(selected, 1, -1)).toEqual(["a", "b"]);
  });

  it("rejects a variant that is not approved", () => {
    expect(() => selectVariant("QUEUE", [], "missing", new Set(["a"]))).toThrow(/not on this plan/);
  });

  it("builds a surprise registration without variant ids", () => {
    const body = buildRegisterBody({
      zoneCode: "UAE",
      planCode: "MONTHLY_65",
      mode: "SURPRISE",
      audience: "WOMEN",
      variantIds: [],
      customerAddressId: "addr",
      consentTextVersion: "from-legal",
      allowedVariantIds: ["v-high"],
    });
    expect(body.variantIds).toBeUndefined();
    expect("scheduleVersionId" in body).toBe(false);
    expect(body.mode).toBe("SURPRISE");
    expect(body.audience).toBe("WOMEN");
  });

  it("includes audience for replenishment and queue", () => {
    const shared = {
      zoneCode: "UAE",
      planCode: "MONTHLY_65",
      audience: "MEN" as const,
      customerAddressId: "addr",
      consentTextVersion: "from-legal",
      allowedVariantIds: ["v-high", "v-cheap"],
    };
    expect(
      buildRegisterBody({ ...shared, mode: "REPLENISHMENT", variantIds: ["v-high"] }).audience,
    ).toBe("MEN");
    const queue = buildRegisterBody({ ...shared, mode: "QUEUE", variantIds: ["v-cheap", "v-high"] });
    expect(queue.audience).toBe("MEN");
    expect(queue.variantIds).toEqual(["v-cheap", "v-high"]);
    expect(registrationFingerprint(queue)).not.toBe(
      registrationFingerprint({ ...queue, audience: "WOMEN" }),
    );
  });

  it("keeps the storefront queue at 12", () => {
    const allowed = new Set(Array.from({ length: 13 }, (_, index) => `v${index}`));
    let selected: string[] = [];
    for (let index = 0; index < 12; index += 1) {
      selected = selectVariant("QUEUE", selected, `v${index}`, allowed);
    }
    expect(selected).toHaveLength(12);
    expect(() => selectVariant("QUEUE", selected, "v12", allowed)).toThrow(/12 fragrances/);
    expect(() =>
      buildRegisterBody({
        zoneCode: "UAE",
        planCode: "MONTHLY_65",
        mode: "QUEUE",
        audience: "MEN",
        variantIds: [...allowed],
        customerAddressId: "addr",
        consentTextVersion: "from-legal",
        allowedVariantIds: [...allowed],
      }),
    ).toThrow(/12 fragrances/);
  });

  it("removes picks that are not eligible for the new audience", () => {
    const result = retainAudienceSelections(["men", "uni", "women"], ["uni", "women"]);
    expect(result).toEqual({ selected: ["uni", "women"], removed: 1 });
    expect(audienceChangeNotice(1)).toMatch(/not available for this audience/);
  });

  it("describes a pinned surprise schedule as provisional", () => {
    expect(
      surpriseAccountNote({ schedulePinned: true, previewSource: "SCHEDULE", previewSku: "SKU-1" }),
    ).toMatch(/provisional/i);
    expect(
      surpriseAccountNote({ schedulePinned: true, previewSource: "SCHEDULE", previewSku: "SKU-1" }),
    ).toMatch(/not a shipment/);
    expect(
      surpriseAccountNote({
        schedulePinned: false,
        previewSource: "PROVISIONAL_POOL",
        previewSku: "HIDDEN",
      }),
    ).toBe("No published schedule is pinned. No fragrance is allocated and no shipment is promised.");
    expect(
      surpriseAccountNote({ schedulePinned: false, previewSource: "PROVISIONAL_POOL", previewSku: "HIDDEN" }),
    ).not.toContain("HIDDEN");
  });

  it("reuses an idempotency key and issues a new one for another signup", () => {
    const store = memoryStore();
    const body = buildRegisterBody({
      zoneCode: "UAE",
      planCode: "MONTHLY_65",
      mode: "REPLENISHMENT",
      audience: "MEN",
      variantIds: ["v-high"],
      customerAddressId: "addr",
      consentTextVersion: "from-legal",
      allowedVariantIds: ["v-high"],
    });
    const fingerprint = registrationFingerprint(body);
    const first = registrationIdempotencyKey(fingerprint, store);
    expect(registrationIdempotencyKey(fingerprint, store)).toBe(first);
    expect(replaceRegistrationIdempotencyKey(fingerprint, store)).not.toBe(first);
  });

  it("describes a pending registration without payment or renewal", () => {
    const lines = registrationSuccessCopy({
      planName: "Monthly",
      amount: "100.00",
      currencyCode: "AED",
      mode: "QUEUE",
      fragranceNames: ["Rose"],
    });
    const text = lines.join(" ");
    expect(text).toContain("Pending activation");
    expect(text).toContain("Total AED 100.00/month");
    expect(text).toContain("Shipping included");
    expect(text).toContain("Rose");
    expect(() => assertNoBillingCopy(text)).not.toThrow();
  });

  it("accepts only an available published agreement", () => {
    const published = {
      available: true,
      version: "market-live-1",
      text: "Exact published wording.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    };
    expect(activeRegistrationConsent(published)).toEqual({
      version: "market-live-1",
      text: "Exact published wording.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    });
    expect(
      activeRegistrationConsent({
        available: false,
        version: "draft-1",
        text: "Draft wording must stay hidden.",
        publishedAt: null,
      }),
    ).toBeNull();
    expect(
      activeRegistrationConsent({
        available: true,
        version: null,
        text: null,
        publishedAt: null,
      }),
    ).toBeNull();
  });
});
