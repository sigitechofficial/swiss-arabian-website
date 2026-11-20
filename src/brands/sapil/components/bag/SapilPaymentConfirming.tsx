"use client";

import { useBagPaymentConfirming } from "@/features/cart/hooks/useBagPaymentConfirming";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cx } from "../../ui";

/** v9 note, only while a payment for this bag is being confirmed (as on Swiss Arabian). */
export function SapilPaymentConfirming({ className }: { className?: string }) {
  const t = useShopCopy();
  if (!useBagPaymentConfirming()) return null;
  return (
    <div
      role="status"
      data-sapil="payment-confirming"
      className={cx("rounded-[16px] bg-sapil-p-butter text-sapil-ink px-[16px] py-[14px] text-[14px] leading-[1.45]", className)}
    >
      <p className="font-[600] m-0">{t("cart.paymentConfirming.title")}</p>
      <p className="m-0 mt-[4px] text-sapil-ink-2 text-[13px]">{t("cart.paymentConfirming.body")}</p>
    </div>
  );
}
