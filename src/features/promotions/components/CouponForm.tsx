"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
  const t = useShopCopy();
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
      <p className={couponLabel}>{t("promotions.coupon.label")}</p>
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
              {appliedIsFixedBxgy
                ? t("promotions.applied.amount", { amount: formatMoney(appliedView.amount, currency) })
                : `−${formatMoney(appliedView.amount, currency)}`}
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
            {removing ? t("loyalty.redeem.removing") : t("account.remove")}
          </button>
        </div>
      ) : null}
      <form className={couponForm} onSubmit={(e) => void onApply(e)}>
        <input
          name="coupon"
          autoComplete="off"
          spellCheck={false}
          aria-label={t("promotions.coupon.label")}
          aria-invalid={fieldError ? true : undefined}
          placeholder={
            applied?.code ? t("promotions.coupon.replacePlaceholder") : t("promotions.coupon.placeholder")
          }
          value={value}
          onChange={(e) => setCode(e.target.value)}
          disabled={busy || !cartId}
        />
        <button type="submit" disabled={busy || !cartId || !code.trim()}>
          {applying ? t("loyalty.redeem.applying") : applied?.code ? t("promotions.coupon.replace") : t("loyalty.redeem.apply")}
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
