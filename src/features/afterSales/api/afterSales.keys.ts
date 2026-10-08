export const afterSalesKeys = {
  all: ["after-sales"] as const,
  returns: () => [...afterSalesKeys.all, "returns"] as const,
  returnList: (status?: string | null, orderId?: string | null, offset = 0) =>
    [...afterSalesKeys.returns(), status ?? "all", orderId ?? "any", offset] as const,
  returnDetail: (id: string) => [...afterSalesKeys.returns(), "detail", id] as const,
  exchanges: () => [...afterSalesKeys.all, "exchanges"] as const,
  exchangeList: (status?: string | null, orderId?: string | null, offset = 0) =>
    [
      ...afterSalesKeys.exchanges(),
      status ?? "all",
      orderId ?? "any",
      offset,
    ] as const,
  exchangeDetail: (id: string) =>
    [...afterSalesKeys.exchanges(), "detail", id] as const,
  guest: (orderNumber: string) =>
    [...afterSalesKeys.all, "guest", orderNumber] as const,
  guestReturns: (orderNumber: string) =>
    [...afterSalesKeys.guest(orderNumber), "returns"] as const,
  guestExchanges: (orderNumber: string) =>
    [...afterSalesKeys.guest(orderNumber), "exchanges"] as const,
};
