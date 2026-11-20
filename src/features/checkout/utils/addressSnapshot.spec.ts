import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/api/auth.service", () => ({ toE164Phone: (v: string) => v }));

import { buildAddressSnapshot } from "./addressSnapshot";

const fields = { fullName: "QA Shopper", phone: "+971501234567", address1: "Al Wasl Road", city: "Dubai", emirate: "Dubai" };

describe("buildAddressSnapshot", () => {
  it("stores no postcode when the shopper gave none (no stand-in value)", () => {
    expect(buildAddressSnapshot(fields)).not.toHaveProperty("postalCode");
    expect(buildAddressSnapshot({ ...fields, postalCode: "   " })).not.toHaveProperty("postalCode");
  });

  it("keeps a postcode the shopper entered", () => {
    expect(buildAddressSnapshot({ ...fields, postalCode: " 12211 " }).postalCode).toBe("12211");
  });
});
