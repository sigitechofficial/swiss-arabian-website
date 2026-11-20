"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useBagPaymentConfirming } from "../hooks/useBagPaymentConfirming";

/** Shown only while a payment for this bag is being confirmed (no order details). */
export function CartPaymentConfirmingNotice({ compact = false }: { compact?: boolean }) {
  const t = useShopCopy();
  if (!useBagPaymentConfirming()) return null;
  return (
    <div
      role="status"
      className={`rounded-[var(--radius-card,12px)] border border-[var(--copper,#8c4435)]/30 bg-[var(--beige,#e8d8bb)]/40 text-[var(--ink,#241f1b)] ${
        compact ? "mx-4 my-3 px-4 py-3 text-[0.85rem]" : "mb-6 px-5 py-4 text-[0.92rem]"
      }`}
    >
      <p className="font-medium">{t("cart.paymentConfirming.title")}</p>
      <p className="mt-1 text-[var(--ink-2,#6b5f53)]">{t("cart.paymentConfirming.body")}</p>
    </div>
  );
}
