"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCouponForm } from "../hooks/useCouponForm";
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
  const {
    cartId,
    currency,
    applied,
    appliedView,
    appliedIsFixedBxgy,
    value,
    setCode,
    code,
    fieldError,
    applying,
    removing,
    busy,
    onApply,
    onRemove,
  } = useCouponForm();

  return (
    <div className={couponBox} data-coupon="">
      <p className={couponLabel}>Promo code</p>
      {applied?.code ? (
        <div className={couponApplied}>
          <div>
            <p className={couponAppliedName}>
              {appliedView?.label || applied.code}
            </p>
            <p className={couponAppliedCode}>{applied.code}</p>
          </div>
          {appliedView?.amount != null && appliedView.amount > 0 ? (
            <span className={couponAppliedAmt} dir="ltr">
              {appliedIsFixedBxgy ? "Applied · " : "−"}
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
            {removing ? "Removing…" : "Remove"}
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
          placeholder={
            applied?.code ? "Replace with another code" : "Enter code"
          }
          value={value}
          onChange={(e) => setCode(e.target.value)}
          disabled={busy || !cartId}
        />
        <button type="submit" disabled={busy || !cartId || !code.trim()}>
          {applying ? "Applying…" : applied?.code ? "Replace" : "Apply"}
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
