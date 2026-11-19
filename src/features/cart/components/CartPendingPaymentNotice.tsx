"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useCartStore } from "@/stores/useCartStore";

/**
 * The server says an unpaid order holds this bag (checkout QA-006): the shopper
 * started paying and didn't finish, on this device or another. Offer to finish
 * that payment; changing the bag cancels that order on the server and keeps
 * the bag as it is. Same for every payment method.
 */
export function CartPendingPaymentNotice({ compact = false }: { compact?: boolean }) {
  const pending = useCartStore((s) => s.pendingPayment);
  if (!pending) return null;
  const retryHref = `/checkout/payment/cancel?orderId=${encodeURIComponent(pending.orderId)}`;
  return (
    <div
      role="status"
      className={`rounded-[var(--radius-card,12px)] border border-[var(--copper,#8c4435)]/30 bg-[var(--beige,#e8d8bb)]/40 text-[var(--ink,#241f1b)] ${
        compact ? "mx-4 my-3 px-4 py-3 text-[0.85rem]" : "mb-6 px-5 py-4 text-[0.92rem]"
      }`}
    >
      <p className="font-medium">Payment for order {pending.orderNumber} isn’t finished.</p>
      <p className="mt-1 text-[var(--ink-2,#6b5f53)]">
        Your bag is saved with it. Finish paying, or change your bag to cancel that order.
      </p>
      <LocaleLink
        href={retryHref}
        className="mt-2 inline-block font-medium text-[var(--copper,#8c4435)] underline underline-offset-4"
      >
        Complete payment
      </LocaleLink>
    </div>
  );
}
