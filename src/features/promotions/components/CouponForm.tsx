"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/apiError";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useCouponMutations } from "@/features/cart/hooks/useCouponMutations";
import { appliedCoupon } from "../types/promotions";
import { couponErrorMessage } from "../utils/couponErrors";
import {
  couponLoginHref,
  peekPendingCoupon,
  takePendingCoupon,
} from "../utils/pendingCoupon";

export function CouponForm() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const promotions = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const currency =
    promotions?.context.currencyCode ?? totals?.currency ?? "AED";
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
  const amount = applied ? Number(applied.amount) : 0;

  return (
    <div className="coupon-box">
      <p className="coupon-box__label">Promo code</p>
      {applied?.code ? (
        <div className="coupon-applied">
          <div>
            <p className="coupon-applied__name">{applied.label || applied.code}</p>
            <p className="coupon-applied__code">{applied.code}</p>
          </div>
          {amount > 0 ? (
            <span className="coupon-applied__amt" dir="ltr">
              −{formatMoney(amount, currency)}
            </span>
          ) : null}
          <button
            type="button"
            className="coupon-applied__remove"
            onClick={() => void onRemove()}
            disabled={busy}
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : null}
      <form className="coupon-form" onSubmit={(e) => void onApply(e)}>
        <input
          className={fieldError ? "is-err" : undefined}
          name="coupon"
          autoComplete="off"
          spellCheck={false}
          aria-label="Promo code"
          aria-invalid={Boolean(fieldError)}
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
        <p className="coupon-box__error" role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
