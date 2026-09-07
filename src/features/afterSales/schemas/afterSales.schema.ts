import { z } from "zod";
import {
  EXCHANGE_REASON_CODES,
  EXCHANGE_TYPES,
  RETURN_REASON_CODES,
  RETURN_RESOLUTIONS,
} from "../types/afterSales";

export const afterSalesLineSchema = z.object({
  orderLineId: z.string().min(1),
  selected: z.boolean(),
  quantity: z.number().int().min(1).max(999),
  maxQty: z.number().int().min(1),
  sku: z.string(),
  replacementSku: z.string().optional(),
  replacementSize: z.string().optional(),
});

export const returnRequestSchema = z
  .object({
    reasonCode: z.enum(RETURN_REASON_CODES),
    requestedResolution: z.enum(RETURN_RESOLUTIONS),
    reasonText: z.string().max(500),
    customerNote: z.string().max(1000),
    lines: z.array(afterSalesLineSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const selected = value.lines.filter((line) => line.selected);
    if (selected.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one item",
        path: ["lines"],
      });
    }
    selected.forEach((line, index) => {
      if (line.quantity > line.maxQty) {
        ctx.addIssue({
          code: "custom",
          message: "Quantity is more than ordered",
          path: ["lines", index, "quantity"],
        });
      }
    });
  });

export type ReturnRequestFormValues = z.infer<typeof returnRequestSchema>;

export const exchangeRequestSchema = z
  .object({
    reasonCode: z.enum(EXCHANGE_REASON_CODES),
    exchangeType: z.enum(EXCHANGE_TYPES),
    customerNote: z.string().max(1000),
    lines: z.array(afterSalesLineSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const selected = value.lines.filter((line) => line.selected);
    if (selected.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one item",
        path: ["lines"],
      });
    }
    selected.forEach((line, index) => {
      if (line.quantity > line.maxQty) {
        ctx.addIssue({
          code: "custom",
          message: "Quantity is more than ordered",
          path: ["lines", index, "quantity"],
        });
      }
      if (!line.replacementSku?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Replacement SKU is required",
          path: ["lines", index, "replacementSku"],
        });
      }
    });
  });

export type ExchangeRequestFormValues = z.infer<typeof exchangeRequestSchema>;
