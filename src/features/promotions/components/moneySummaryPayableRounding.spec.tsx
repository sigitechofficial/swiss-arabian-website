import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import type { ShopLocale } from "@/lib/i18n/locales";
import { payableRoundingFrom } from "../types/promotions";
import { MoneySummary } from "./MoneySummary";

afterEach(cleanup);

/**
 * KWD/BHD/OMR: the amount due is rounded down to the market's step by the server
 * (KWD 10.125 → 10.120). The summary explains the gap with a Rounding row.
 */
describe("MoneySummary payable rounding", () => {
  function renderKwd(props: { amountPayable: number | null; payableRounding: number | null }) {
    return render(
      <ShopLocaleProvider locale={"en" as ShopLocale} messages={en}>
        <MoneySummary
          className="cart-totals"
          currency="KWD"
          subtotal={10.125}
          discount={0}
          shippingDiscount={0}
          total={10.125}
          {...props}
        />
      </ShopLocaleProvider>,
    );
  }

  it("shows the rounding and the rounded amount due", () => {
    renderKwd({ amountPayable: 10.12, payableRounding: -0.005 });
    expect(screen.getByText("Rounding")).toBeTruthy();
    expect(screen.getByText("−KWD 0.005")).toBeTruthy();
    expect(screen.getAllByText("KWD 10.125")).toHaveLength(2); // subtotal and total
    expect(screen.getByText("KWD 10.120")).toBeTruthy();
  });

  it("adds nothing when there is no rounding", () => {
    renderKwd({ amountPayable: 10.12, payableRounding: null });
    expect(screen.queryByText("Rounding")).toBeNull();
  });
});

describe("payableRoundingFrom", () => {
  it("reads the server's rounding: explicit values win over the snapshot", () => {
    const snapshot = { totals: { discountTotal: "0", payableRounding: "-0.005" } } as never;
    expect(payableRoundingFrom(snapshot)).toBe(-0.005);
    expect(payableRoundingFrom(snapshot, ["-0.002"])).toBe(-0.002);
  });

  it("is null for no rounding or a missing value", () => {
    expect(payableRoundingFrom(null, ["0.000"])).toBeNull();
    expect(payableRoundingFrom(null, [null, ""])).toBeNull();
    expect(payableRoundingFrom(undefined)).toBeNull();
  });
});
