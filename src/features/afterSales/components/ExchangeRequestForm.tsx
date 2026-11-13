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
  exchangeRequestSchema,
  type ExchangeRequestFormValues,
} from "../schemas/afterSales.schema";
import type {
  AfterSalesOrderLine,
  CreateExchangeDto,
} from "../types/afterSales";
import { afterSalesErrorMessage } from "../utils/afterSalesErrors";
import { afterSalesOptionCodes, afterSalesOptionLabel } from "../utils/eligibility";
import { AfterSalesLinePicker } from "./AfterSalesLinePicker";

type ExchangeRequestFormProps = {
  lines: AfterSalesOrderLine[];
  onCancel?: () => void;
  onSubmitted?: () => void;
} & (
  | { mode: "customer"; orderId: string }
  | { mode: "guest"; orderNumber: string; orderAccessToken: string }
);

function toExchangeDto(values: ExchangeRequestFormValues): CreateExchangeDto {
  const items = values.lines
    .filter((line) => line.selected)
    .map((line) => {
      const item: CreateExchangeDto["items"][number] = {
        orderLineId: line.orderLineId,
        quantity: line.quantity,
        replacementSku: line.replacementSku?.trim() || line.sku,
        reasonCode: values.reasonCode,
      };
      const size = line.replacementSize?.trim();
      if (size) item.replacementSize = size;
      return item;
    });
  const dto: CreateExchangeDto = {
    items,
    reasonCode: values.reasonCode,
    exchangeType: values.exchangeType,
  };
  const customerNote = values.customerNote.trim();
  if (customerNote) dto.customerNote = customerNote;
  return dto;
}

export function ExchangeRequestForm(props: ExchangeRequestFormProps) {
  const { lines, onCancel, onSubmitted } = props;
  const t = useShopCopy();
  const { createExchange, createGuestExchange } = useAfterSalesMutations();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExchangeRequestFormValues>({
    resolver: zodResolver(exchangeRequestSchema),
    defaultValues: {
      reasonCode: "WRONG_VARIANT",
      exchangeType: "SIZE_OR_COLOR_CHANGE",
      customerNote: "",
      lines: lines.map((line) => ({
        orderLineId: line.orderLineId,
        selected: true,
        quantity: line.quantity,
        maxQty: line.quantity,
        sku: line.sku,
        replacementSku: line.sku,
        replacementSize: "",
      })),
    },
  });

  const pending = createExchange.isPending || createGuestExchange.isPending;

  return (
    <form
      className="flex flex-col gap-4 border border-sa-border bg-page p-5"
      onSubmit={handleSubmit(async (values) => {
        try {
          const dto = toExchangeDto(values);
          if (props.mode === "customer") {
            await createExchange.unwrap({ orderId: props.orderId, dto });
          } else {
            await createGuestExchange.unwrap({
              orderNumber: props.orderNumber,
              orderAccessToken: props.orderAccessToken,
              dto,
            });
          }
          toast(t("afterSales.exchangeSubmitted"), "success");
          onSubmitted?.();
        } catch (error) {
          toast(afterSalesErrorMessage(error, t), "error");
        }
      })}
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
