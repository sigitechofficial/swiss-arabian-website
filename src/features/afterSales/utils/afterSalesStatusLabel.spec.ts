import { describe, expect, it } from "vitest";
import { afterSalesStatusLabel } from "./eligibility";

describe("after-sales status label", () => {
  it("words every return status the backend sends, never a generic fallback", () => {
    expect(afterSalesStatusLabel("REFUNDED")).toBe("Refund completed");
    expect(afterSalesStatusLabel("REFUND_PENDING")).toBe("Refund processing");
    expect(afterSalesStatusLabel("IN_TRANSIT")).toBe("On its way back to us");
    expect(afterSalesStatusLabel("INSPECTION_PENDING")).toBe("Being checked");
    expect(afterSalesStatusLabel("RETURN_SHIPMENT_CREATED")).toBe("Return pickup arranged");
  });

  it("falls back to in progress for unknown codes", () => {
    expect(afterSalesStatusLabel("SOMETHING_NEW")).toBe("In progress");
  });
});
