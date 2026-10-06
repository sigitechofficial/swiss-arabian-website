"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/apiError";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useCouponMutations } from "@/features/cart/hooks/useCouponMutations";
import { appliedCoupon, appliedPromotionView, isFixedAmountBxgy } from "../types/promotions";
import { couponErrorMessage } from "../utils/couponErrors";
import {
  couponLoginHref,
  peekPendingCoupon,
  takePendingCoupon,
} from "../utils/pendingCoupon";
import {
  couponApplied,
  couponAppliedAmt,
  couponAppliedCode,
  couponAppliedName,
  couponAppliedRemove,
  couponBox,
  couponError,
  couponForm,
  couponLabel,
} from "@/styles/cartChrome";

export function CouponForm() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const promotions = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const currency =
    promotions?.context?.currencyCode ?? totals?.currency ?? "AED";
  const { apply, remove, cartId } = useCouponMutations();

  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const applied = appliedCoupon(promotions);

  useEffect(() => {
    if (!bootstrapped || !isAuthenticated || !cartId) return;
    if (!peekPendingCoupon()) return;
    const pending = takePendingCoupon();
    if (!pending) return;
    setCode(pending);
    void apply
      .mutateAsync(pending)
      .then(() => {
        setFieldError(null);
        setCode("");
      })
      .catch((error: unknown) => {
        setFieldError(couponErrorMessage(error, currency));
      });
    // Apply once after login; `apply` identity is not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, isAuthenticated, cartId]);

  async function onApply(event: FormEvent) {
    event.preventDefault();
    const next = code.trim();
    if (!next || !cartId) return;
    setFieldError(null);
    try {
      await apply.mutateAsync(next);
      setCode("");
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "COUPON_REQUIRES_LOGIN") {
        router.push(couponLoginHref(pathname || "/cart", next));
        return;
      }
      setFieldError(couponErrorMessage(error, currency));
    }
  }

  async function onRemove() {
    if (!applied?.code) return;
    setFieldError(null);
    try {
      await remove.mutateAsync(applied.code);
    } catch (error) {
      setFieldError(couponErrorMessage(error, currency));
    }
  }

  const busy = apply.isPending || remove.isPending;
  const appliedView = applied ? appliedPromotionView(applied, promotions) : null;

  return (
    <div className={couponBox} data-coupon="">
      <p className={couponLabel}>Promo code</p>
      {applied?.code ? (
        <div className={couponApplied}>
          <div>
            <p className={couponAppliedName}>{appliedView?.label || applied.code}</p>
            <p className={couponAppliedCode}>{applied.code}</p>
          </div>
          {appliedView?.amount != null && appliedView.amount > 0 ? (
            <span className={couponAppliedAmt} dir="ltr">
              {applied && isFixedAmountBxgy(applied) ? "Applied · " : "−"}
              {formatMoney(appliedView.amount, currency)}
            </span>
          ) : appliedView?.status ? (
            <span className={couponAppliedAmt}>{appliedView.status}</span>
          ) : null}
          <button
            type="button"
            className={couponAppliedRemove}
            onClick={() => void onRemove()}
            disabled={busy}
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : null}
      <form className={couponForm} onSubmit={(e) => void onApply(e)}>
        <input
          name="coupon"
          autoComplete="off"
          spellCheck={false}
          aria-label="Promo code"
          aria-invalid={fieldError ? true : undefined}
          placeholder={applied?.code ? "Replace with another code" : "Enter code"}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          disabled={busy || !cartId}
        />
        <button type="submit" disabled={busy || !cartId || !code.trim()}>
          {apply.isPending ? "Applying…" : applied?.code ? "Replace" : "Apply"}
        </button>
      </form>
      {fieldError ? (
        <p className={couponError} role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
