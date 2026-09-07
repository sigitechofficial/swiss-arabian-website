"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
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
import {
  afterSalesErrorMessage,
  EXCHANGE_SUBMITTED_TOAST,
} from "../utils/afterSalesErrors";
import {
  EXCHANGE_REASON_LABELS,
  EXCHANGE_TYPE_LABELS,
} from "../utils/eligibility";
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
          toast(EXCHANGE_SUBMITTED_TOAST, "success");
          onSubmitted?.();
        } catch (error) {
          toast(afterSalesErrorMessage(error), "error");
        }
      })}
    >
      <p className="text-[14px] font-semibold text-sa-primary">
        Request an exchange
      </p>
      <p className="text-[13px] leading-relaxed text-sa-muted">
        This records what you would like instead. It does not place a new order
        or ship a replacement.
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
            Reason
          </span>
          <select className={accountSelectClass} {...register("reasonCode")}>
            {Object.entries(EXCHANGE_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            Exchange type
          </span>
          <select className={accountSelectClass} {...register("exchangeType")}>
            {Object.entries(EXCHANGE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
          Note for our team (optional)
        </span>
        <textarea
          rows={2}
          className={`${accountInputClass} h-auto py-3`}
          {...register("customerNote")}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={accountBtnPrimary}>
          {pending ? "Submitting…" : "Submit exchange request"}
        </button>
        {onCancel ? (
          <button type="button" className={accountBtnGhost} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
