"use client";

import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  exchangeRequestSchema,
  returnRequestSchema,
  type ExchangeRequestFormValues,
  type ReturnRequestFormValues,
} from "../schemas/afterSales.schema";
import type { AfterSalesOrderLine } from "../types/afterSales";
import { afterSalesErrorMessage } from "../utils/afterSalesErrors";
import { toExchangeDto, toReturnDto, toReturnEstimateDto } from "../utils/requestDtos";
import { useAfterSalesMutations, useReturnEstimate, type ReturnOrderTarget } from "./useAfterSales";

/** Whose order the request is for: the signed-in customer's, or a guest's (number + access token). */
export type AfterSalesFormTarget =
  | { mode: "customer"; orderId: string }
  | { mode: "guest"; orderNumber: string; orderAccessToken: string };

export type AfterSalesFormProps = AfterSalesFormTarget & {
  lines: AfterSalesOrderLine[];
  onCancel?: () => void;
  onSubmitted?: () => void;
};

function targetOf(props: AfterSalesFormTarget): ReturnOrderTarget {
  return props.mode === "customer"
    ? { mode: "customer", orderId: props.orderId }
    : { mode: "guest", orderNumber: props.orderNumber, orderAccessToken: props.orderAccessToken };
}

/**
 * The return request form for every brand: the form (lines, reason,
 * resolution, notes), the live refund estimate for a refund, adding a free
 * gift the market needs back, and submitting (toast on success or failure).
 * Each brand draws its own fields from this.
 */
export function useReturnRequestForm(props: AfterSalesFormProps) {
  const { lines, onSubmitted } = props;
  const t = useShopCopy();
  const { createReturn, createGuestReturn } = useAfterSalesMutations();
  const form = useForm<ReturnRequestFormValues>({
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
  const { control, setValue, handleSubmit } = form;
  const [watchedLines, reasonCode, requestedResolution] = useWatch({
    control,
    name: ["lines", "reasonCode", "requestedResolution"],
  });
  const estimate = useReturnEstimate(
    targetOf(props),
    toReturnEstimateDto({ lines: watchedLines, reasonCode, requestedResolution }),
  );

  /** The form rows of the free gift line(s) the market needs back, when they are on this form. */
  const giftLineIndexes = (orderLineIds: string[]) =>
    lines
      .map((line, index) => (orderLineIds.includes(line.orderLineId) ? index : -1))
      .filter((index) => index >= 0);
  const giftOnForm =
    giftLineIndexes(estimate.data?.giftRequirement.gifts.map((gift) => gift.orderLineId) ?? []).length > 0;

  const onSubmit = handleSubmit(async (values) => {
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
  });

  return {
    form,
    onSubmit,
    pending: createReturn.isPending || createGuestReturn.isPending,
    estimate,
    /** Only a refund has an estimate. */
    showEstimate: requestedResolution === "REFUND",
    /** "Add the gift to this return", when the gift is on this form. */
    addGift: giftOnForm
      ? (orderLineIds: string[]) => {
          for (const index of giftLineIndexes(orderLineIds)) {
            setValue(`lines.${index}.selected`, true, { shouldDirty: true });
            setValue(`lines.${index}.quantity`, lines[index].quantity, { shouldDirty: true });
          }
        }
      : undefined,
  };
}

/**
 * The exchange request form for every brand: the form (lines, replacement
 * SKU and size, reason, type, note) and submitting (toast on success or failure).
 */
export function useExchangeRequestForm(props: AfterSalesFormProps) {
  const { lines, onSubmitted } = props;
  const t = useShopCopy();
  const { createExchange, createGuestExchange } = useAfterSalesMutations();
  const form = useForm<ExchangeRequestFormValues>({
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

  const onSubmit = form.handleSubmit(async (values) => {
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
  });

  return { form, onSubmit, pending: createExchange.isPending || createGuestExchange.isPending };
}

type LineErrorShape = {
  message?: string;
  root?: { message?: string };
} & Record<number, { quantity?: { message?: string }; replacementSku?: { message?: string } } | undefined>;

/**
 * The line picker's validation messages (raw keys; show them with `formErrorText`):
 * one for the whole list ("choose at least one item"), and per line.
 */
export function afterSalesLineErrors(errors: FieldErrors<{ lines: unknown }>) {
  const lines = errors.lines as LineErrorShape | undefined;
  const listMessage = lines?.message ?? lines?.root?.message;
  return {
    list: typeof listMessage === "string" ? listMessage : null,
    line: (index: number) => ({
      quantity: lines?.[index]?.quantity?.message ?? null,
      replacementSku: lines?.[index]?.replacementSku?.message ?? null,
    }),
  };
}
