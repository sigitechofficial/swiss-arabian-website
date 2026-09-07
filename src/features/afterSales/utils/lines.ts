import type { AfterSalesOrderLine } from "../types/afterSales";

export function parseOrderQty(quantity: string | number | null | undefined): number {
  const n =
    typeof quantity === "number"
      ? quantity
      : Number.parseInt(String(quantity ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function mapOrderLinesForAfterSales(
  lines: {
    orderLineId: string;
    sku: string;
    productName: string | null;
    variantName?: string | null;
    quantity: string | number;
  }[],
): AfterSalesOrderLine[] {
  return lines
    .filter((line) => Boolean(line.orderLineId))
    .map((line) => ({
      orderLineId: line.orderLineId,
      sku: line.sku,
      productName: line.productName,
      variantName: line.variantName ?? null,
      quantity: parseOrderQty(line.quantity),
    }));
}

export function guestAfterSalesLines(order: {
  lines?: {
    orderLineId?: string | null;
    sku: string;
    productName: string | null;
    variantName?: string | null;
    quantity: string | number;
  }[];
  shipments?: {
    items?: {
      orderLineId?: string | null;
      sku: string;
      productName: string | null;
      variantName?: string | null;
      quantity: string | number;
    }[];
  }[];
}): AfterSalesOrderLine[] {
  const fromLines = mapOrderLinesForAfterSales(
    (order.lines ?? []).flatMap((line) =>
      line.orderLineId
        ? [
            {
              orderLineId: line.orderLineId,
              sku: line.sku,
              productName: line.productName,
              variantName: line.variantName,
              quantity: line.quantity,
            },
          ]
        : [],
    ),
  );
  if (fromLines.length > 0) return fromLines;

  const byId = new Map<string, AfterSalesOrderLine>();
  for (const shipment of order.shipments ?? []) {
    for (const item of shipment.items ?? []) {
      if (!item.orderLineId) continue;
      const existing = byId.get(item.orderLineId);
      const qty = parseOrderQty(item.quantity);
      if (existing) {
        existing.quantity += qty;
        continue;
      }
      byId.set(item.orderLineId, {
        orderLineId: item.orderLineId,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName ?? null,
        quantity: qty,
      });
    }
  }
  return [...byId.values()];
}
