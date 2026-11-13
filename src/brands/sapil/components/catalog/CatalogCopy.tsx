import type { ReactNode } from "react";
import { routeLocale } from "@/lib/i18n/routeLocale";
import { SapilCopyProvider } from "../../i18n/SapilCopy";
import { loadSapilMessages } from "../../i18n/load";

/**
 * Sapil's wording for the route's language around a catalog page (server).
 * The Sapil shell provides the same once it is merged; until then the catalog
 * pages load it themselves so /ar/… reads Arabic. Harmless inside the shell.
 */
export async function CatalogCopy({ children }: { children: ReactNode }) {
  const messages = await loadSapilMessages(await routeLocale());
  return <SapilCopyProvider messages={messages}>{children}</SapilCopyProvider>;
}
