type ClientErrorContext = {
  boundary: "route" | "root";
  digest?: string;
};

/**
 * Records a render crash. This logs in the browser only.
 * A reporter can send from here once a destination exists.
 */
export function reportClientError(
  error: unknown,
  context: ClientErrorContext,
): void {
  const digest = context.digest ? ` ${context.digest}` : "";
  console.error(`[storefront] ${context.boundary} crash${digest}`, error);
}
