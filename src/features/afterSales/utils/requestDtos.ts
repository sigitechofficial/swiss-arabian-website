import type {
  ExchangeRequestFormValues,
  ReturnRequestFormValues,
} from "../schemas/afterSales.schema";
import type { CreateExchangeDto, CreateReturnDto, ReturnEstimateDto } from "../types/afterSales";

/** The return request the backend takes, from the form (selected lines only). */
export function toReturnDto(values: ReturnRequestFormValues): CreateReturnDto {
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

/** What the estimate is asked for: the selected lines and the reason (refunds only). */
export function toReturnEstimateDto(
  values: Pick<ReturnRequestFormValues, "lines" | "reasonCode" | "requestedResolution">,
): ReturnEstimateDto | null {
  if (values.requestedResolution !== "REFUND") return null;
  const items = (values.lines ?? [])
    .filter(
      (line) =>
        line?.selected &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        line.quantity <= line.maxQty,
    )
    .map((line) => ({ orderLineId: line.orderLineId, quantity: line.quantity }));
  if (items.length === 0) return null;
  return { items, reasonCode: values.reasonCode };
}

/** The exchange request the backend takes; an unchanged replacement keeps the line's SKU. */
export function toExchangeDto(values: ExchangeRequestFormValues): CreateExchangeDto {
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
