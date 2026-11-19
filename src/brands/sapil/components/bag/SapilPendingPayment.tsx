"use client";

import { usePendingPayment } from "@/features/cart/hooks/usePendingPayment";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cx } from "../../ui";
import { SapilLink } from "../commerce/shared";

/**
 * v9 notice: a payment for this bag was started and not finished (same rule as
 * Swiss Arabian, `usePendingPayment`). Finish it, or change the bag to cancel it.
 */
export function SapilPendingPayment({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useShopCopy();
  const pending = usePendingPayment();
  if (!pending) return null;
  return (
    <div
      role="status"
      data-sapil="pending-payment"
      className={cx("rounded-[16px] bg-sapil-p-butter text-sapil-ink px-[16px] py-[14px] text-[14px] leading-[1.45]", className)}
    >
      <p className="font-[600] m-0">{t("cart.pendingPayment.title", { orderNumber: pending.orderNumber })}</p>
      <p className="m-0 mt-[4px] text-sapil-ink-2 text-[13px]">{t("cart.pendingPayment.body")}</p>
      <SapilLink
        href={pending.href}
        onClick={onNavigate}
        className="inline-block mt-[8px] font-[600] text-sapil-accent underline underline-offset-[3px]"
      >
        {t("cart.pendingPayment.action")}
      </SapilLink>
    </div>
  );
}
