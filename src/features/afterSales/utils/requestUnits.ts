/** How many items a request is for, as a shopper counts them: units, not order lines. */
export function requestUnitCount(request: { itemCount: number; unitCount?: number }): number {
  return request.unitCount ?? request.itemCount;
}
