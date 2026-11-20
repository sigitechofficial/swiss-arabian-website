import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import type { ShopLocale } from "@/lib/i18n/locales";
import { MoneySummary } from "./MoneySummary";

afterEach(cleanup);

/** The bag's tax row names the market's tax in the page's language. */
describe("MoneySummary tax label", () => {
  const labels = { en: "VAT", ar: "ضريبة القيمة المضافة" };

  function renderIn(locale: string, props: { taxLabel?: string; taxLabels?: Record<string, string> | null }) {
    return render(
      <ShopLocaleProvider locale={locale as ShopLocale} messages={locale === "ar" ? ar : en}>
        <MoneySummary
          className="cart-totals"
          currency="AED"
          subtotal={105}
          discount={0}
          shippingDiscount={0}
          tax={5}
          taxIncluded
          total={105}
          {...props}
        />
      </ShopLocaleProvider>,
    );
  }

  it("reads the Arabic label on an Arabic page, never \"VAT\"", () => {
    renderIn("ar", { taxLabel: "VAT", taxLabels: labels });
    expect(screen.getByText(/ضريبة القيمة المضافة/)).toBeTruthy();
    expect(screen.queryByText(/VAT/)).toBeNull();
  });

  it("reads the English label on an English page", () => {
    renderIn("en", { taxLabel: "ضريبة القيمة المضافة", taxLabels: labels });
    expect(screen.getByText("Includes VAT")).toBeTruthy();
  });

  it("words VAT in the page language when the answer has no label", () => {
    renderIn("ar", {});
    expect(screen.queryByText(/VAT/)).toBeNull();
  });
});
