"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
  accountSelectClass,
} from "@/features/account/constants/accountForm";
import { useExchangeRequestForm, type AfterSalesFormProps } from "../hooks/useAfterSalesForms";
import { afterSalesOptionCodes, afterSalesOptionLabel } from "../utils/eligibility";
import { AfterSalesLinePicker } from "./AfterSalesLinePicker";

export function ExchangeRequestForm(props: AfterSalesFormProps) {
  const { lines, onCancel } = props;
  const t = useShopCopy();
  const { form, onSubmit, pending } = useExchangeRequestForm(props);
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  return (
    <form
      className="flex flex-col gap-4 border border-sa-border bg-page p-5"
      onSubmit={onSubmit}
    >
      <p className="text-[14px] font-semibold text-sa-primary">
        {t("afterSales.requestAnExchange")}
      </p>
      <p className="text-[13px] leading-relaxed text-sa-muted">
        {t("afterSales.exchangeNote")}
      </p>

      <AfterSalesLinePicker
        catalog={lines}
        register={register}
        watch={watch}
        errors={errors}
        showReplacement
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            {t("afterSales.reason")}
          </span>
          <select className={accountSelectClass} {...register("reasonCode")}>
            {afterSalesOptionCodes("exchangeReason").map((value) => (
              <option key={value} value={value}>
                {afterSalesOptionLabel("exchangeReason", value, t)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            {t("afterSales.exchangeType")}
          </span>
          <select className={accountSelectClass} {...register("exchangeType")}>
            {afterSalesOptionCodes("exchangeType").map((value) => (
              <option key={value} value={value}>
                {afterSalesOptionLabel("exchangeType", value, t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
          {t("afterSales.teamNote")}
        </span>
        <textarea
          rows={2}
          className={`${accountInputClass} h-auto py-3`}
          {...register("customerNote")}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={accountBtnPrimary}>
          {pending ? t("reviewForm.submitting") : t("afterSales.submitExchange")}
        </button>
        {onCancel ? (
          <button type="button" className={accountBtnGhost} onClick={onCancel}>
            {t("account.cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
