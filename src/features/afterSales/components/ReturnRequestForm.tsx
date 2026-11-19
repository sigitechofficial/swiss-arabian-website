"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
  accountSelectClass,
} from "@/features/account/constants/accountForm";
import { useReturnRequestForm, type AfterSalesFormProps } from "../hooks/useAfterSalesForms";
import { afterSalesOptionCodes, afterSalesOptionLabel } from "../utils/eligibility";
import { AfterSalesLinePicker } from "./AfterSalesLinePicker";
import { ReturnEstimatePanel } from "./ReturnEstimatePanel";

export function ReturnRequestForm(props: AfterSalesFormProps) {
  const { lines, onCancel } = props;
  const t = useShopCopy();
  const { form, onSubmit, pending, estimate, showEstimate, addGift } = useReturnRequestForm(props);
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
      <p className="text-[14px] font-semibold text-sa-primary">{t("afterSales.requestAReturn")}</p>
      <p className="text-[13px] leading-relaxed text-sa-muted">
        {t("afterSales.returnNote")}
      </p>

      <AfterSalesLinePicker
        catalog={lines}
        register={register}
        watch={watch}
        errors={errors}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            {t("afterSales.reason")}
          </span>
          <select className={accountSelectClass} {...register("reasonCode")}>
            {afterSalesOptionCodes("returnReason").map((value) => (
              <option key={value} value={value}>
                {afterSalesOptionLabel("returnReason", value, t)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            {t("afterSales.resolution")}
          </span>
          <select
            className={accountSelectClass}
            {...register("requestedResolution")}
          >
            {afterSalesOptionCodes("returnResolution")
              .filter((value) => value === "REFUND" || value === "EXCHANGE")
              .map((value) => (
              <option key={value} value={value}>
                {afterSalesOptionLabel("returnResolution", value, t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
          {t("afterSales.moreDetail")}
        </span>
        <textarea
          rows={3}
          className={`${accountInputClass} h-auto py-3`}
          {...register("reasonText")}
        />
      </label>

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

      {showEstimate ? (
        <ReturnEstimatePanel
          estimate={estimate.empty ? undefined : estimate.data}
          empty={estimate.empty}
          loading={estimate.isLoading || (estimate.updating && !estimate.data)}
          updating={estimate.updating}
          error={estimate.error}
          onAddGift={addGift}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={accountBtnPrimary}>
          {pending ? t("reviewForm.submitting") : t("afterSales.submitReturn")}
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
