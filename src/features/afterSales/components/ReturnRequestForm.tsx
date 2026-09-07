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
  returnRequestSchema,
  type ReturnRequestFormValues,
} from "../schemas/afterSales.schema";
import type { AfterSalesOrderLine, CreateReturnDto } from "../types/afterSales";
import {
  afterSalesErrorMessage,
  RETURN_SUBMITTED_TOAST,
} from "../utils/afterSalesErrors";
import {
  RETURN_REASON_LABELS,
  RETURN_RESOLUTION_LABELS,
} from "../utils/eligibility";
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
          toast(RETURN_SUBMITTED_TOAST, "success");
          onSubmitted?.();
        } catch (error) {
          toast(afterSalesErrorMessage(error), "error");
        }
      })}
    >
      <p className="text-[14px] font-semibold text-sa-primary">Request a return</p>
      <p className="text-[13px] leading-relaxed text-sa-muted">
        This submits a request only. It does not refund the order.
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
            Reason
          </span>
          <select className={accountSelectClass} {...register("reasonCode")}>
            {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            Preferred resolution
          </span>
          <select
            className={accountSelectClass}
            {...register("requestedResolution")}
          >
            {Object.entries(RETURN_RESOLUTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
          More detail (optional)
        </span>
        <textarea
          rows={3}
          className={`${accountInputClass} h-auto py-3`}
          {...register("reasonText")}
        />
      </label>

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
          {pending ? "Submitting…" : "Submit return request"}
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
