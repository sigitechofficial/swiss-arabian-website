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
  guestOptions: (orderNumber: string) =>
    [...afterSalesKeys.guest(orderNumber), "options"] as const,
  customerOptions: (orderId: string) =>
    [...afterSalesKeys.all, "options", orderId] as const,
  /** Refund estimate: per order and the exact lines + reason asked. */
  returnEstimate: (orderRef: string, payloadKey: string) =>
    [...afterSalesKeys.all, "return-estimate", orderRef, payloadKey] as const,
  /** Free units per line for a return or an exchange (customer orderId or guest orderNumber). */
  eligibility: (orderRef: string, kind: "return" | "exchange") =>
    [...afterSalesKeys.all, "eligibility", orderRef, kind] as const,
  exchangeOptions: (orderRef: string, locale: string | null) =>
    [...afterSalesKeys.all, "exchange-options", orderRef, locale ?? "default"] as const,
  /** Exchange price estimate: per order and the exact lines + reason asked. */
  exchangeEstimate: (orderRef: string, payloadKey: string) =>
    [...afterSalesKeys.all, "exchange-estimate", orderRef, payloadKey] as const,
  returnsPolicy: (scope: "order" | "guest" | "market", ref: string) =>
    [...afterSalesKeys.all, "returns-policy", scope, ref] as const,
};

/** True for estimate queries (refund or exchange): they describe a draft, see useAfterSalesMutations. */
export function isEstimateKey(queryKey: readonly unknown[]): boolean {
  return (
    queryKey[0] === afterSalesKeys.all[0] &&
    (queryKey[1] === "return-estimate" || queryKey[1] === "exchange-estimate")
  );
}
