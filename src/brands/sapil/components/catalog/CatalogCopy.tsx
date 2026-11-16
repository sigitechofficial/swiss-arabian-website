import type { ReactNode } from "react";

/**
 * Kept for the catalog pages' structure: Sapil's wording for the route's
 * language is provided by the Sapil shell (`SapilCopyProvider`) around every page.
 */
export function CatalogCopy({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
