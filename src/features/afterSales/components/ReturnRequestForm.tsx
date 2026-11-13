"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
  accountSelectClass,
} from "@/features/account/constants/accountForm";
import { useAfterSalesMutations } from "../hooks/useAfterSales";
import {
  returnRequestSchema,
  type ReturnRequestFormValues,
} from "../schemas/afterSales.schema";
import type { AfterSalesOrderLine, CreateReturnDto } from "../types/afterSales";
import { afterSalesErrorMessage } from "../utils/afterSalesErrors";
import { afterSalesOptionCodes, afterSalesOptionLabel } from "../utils/eligibility";
import { AfterSalesLinePicker } from "./AfterSalesLinePicker";

type ReturnRequestFormProps = {
  lines: AfterSalesOrderLine[];
  onCancel?: () => void;
  onSubmitted?: () => void;
} & (
  | { mode: "customer"; orderId: string }
  | { mode: "guest"; orderNumber: string; orderAccessToken: string }
);

function toReturnDto(values: ReturnRequestFormValues): CreateReturnDto {
  const items = values.lines
    .filter((line) => line.selected)
    .map((line) => ({
      orderLineId: line.orderLineId,
      quantity: line.quantity,
      reasonCode: values.reasonCode,
    }));
  const dto: CreateReturnDto = {
    items,
    reasonCode: values.reasonCode,
    requestedResolution: values.requestedResolution,
  };
  const reasonText = values.reasonText.trim();
  const customerNote = values.customerNote.trim();
  if (reasonText) dto.reasonText = reasonText;
  if (customerNote) dto.customerNote = customerNote;
  return dto;
}

export function ReturnRequestForm(props: ReturnRequestFormProps) {
  const { lines, onCancel, onSubmitted } = props;
  const t = useShopCopy();
  const { createReturn, createGuestReturn } = useAfterSalesMutations();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReturnRequestFormValues>({
    resolver: zodResolver(returnRequestSchema),
    defaultValues: {
      reasonCode: "CUSTOMER_CHANGED_MIND",
      requestedResolution: "REFUND",
      reasonText: "",
      customerNote: "",
      lines: lines.map((line) => ({
        orderLineId: line.orderLineId,
        selected: true,
        quantity: line.quantity,
        maxQty: line.quantity,
        sku: line.sku,
      })),
    },
  });

  const pending = createReturn.isPending || createGuestReturn.isPending;

  return (
    <form
      className="flex flex-col gap-4 border border-sa-border bg-page p-5"
      onSubmit={handleSubmit(async (values) => {
        try {
          const dto = toReturnDto(values);
          if (props.mode === "customer") {
            await createReturn.unwrap({ orderId: props.orderId, dto });
          } else {
            await createGuestReturn.unwrap({
              orderNumber: props.orderNumber,
              orderAccessToken: props.orderAccessToken,
              dto,
            });
          }
          toast(t("afterSales.returnSubmitted"), "success");
          onSubmitted?.();
        } catch (error) {
          toast(afterSalesErrorMessage(error, t), "error");
        }
      })}
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
