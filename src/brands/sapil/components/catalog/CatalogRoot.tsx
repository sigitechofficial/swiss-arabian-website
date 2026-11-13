import type { ReactNode } from "react";
import "@/brands/sapil/theme.css";
import { SapilRoot } from "../../ui/SapilRoot";

/**
 * Sapil tokens and fonts around a catalog page. The Sapil shell
 * (`StorefrontShell` override) provides the same root around every page; this
 * keeps the catalog pages correct until it is merged and is harmless inside it
 * (same tokens, same fonts). Remove it once the shell is on the branch.
 */
export function CatalogRoot({ children }: { children: ReactNode }) {
  return <SapilRoot className="flex-1">{children}</SapilRoot>;
}
