"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { usePendingPayment } from "../hooks/usePendingPayment";

/**
 * The server says an unpaid order holds this bag (checkout QA-006): the shopper
 * started paying and didn't finish, on this device or another. Offer to finish
 * that payment; changing the bag cancels that order on the server and keeps
 * the bag as it is. Same for every payment method.
 */
export function CartPendingPaymentNotice({ compact = false }: { compact?: boolean }) {
  const t = useShopCopy();
  const pending = usePendingPayment();
  if (!pending) return null;
  return (
    <div
      role="status"
      className={`rounded-[var(--radius-card,12px)] border border-[var(--copper,#8c4435)]/30 bg-[var(--beige,#e8d8bb)]/40 text-[var(--ink,#241f1b)] ${
        compact ? "mx-4 my-3 px-4 py-3 text-[0.85rem]" : "mb-6 px-5 py-4 text-[0.92rem]"
      }`}
    >
      <p className="font-medium">{t("cart.pendingPayment.title", { orderNumber: pending.orderNumber })}</p>
      <p className="mt-1 text-[var(--ink-2,#6b5f53)]">{t("cart.pendingPayment.body")}</p>
      <LocaleLink
        href={pending.href}
        className="mt-2 inline-block font-medium text-[var(--copper,#8c4435)] underline underline-offset-4"
      >
        {t("cart.pendingPayment.action")}
      </LocaleLink>
    </div>
  );
}
