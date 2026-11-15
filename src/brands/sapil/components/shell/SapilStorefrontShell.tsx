import "@/brands/sapil/theme.css";
import type { ReactNode } from "react";
import type { NavbarVariant } from "@/components/layout/navbar";
import { routeLocale } from "@/lib/i18n/routeLocale";
import { SapilCopyProvider } from "../../i18n/SapilCopy";
import { loadSapilMessages } from "../../i18n/load";
import { SapilRoot } from "../../ui/SapilRoot";
import { SapilChrome } from "./SapilChrome";

/** Loads Sapil's wording for the route's language on the server. */
export async function SapilServerCopy({ children }: { children: ReactNode }) {
  const messages = await loadSapilMessages(await routeLocale());
  return <SapilCopyProvider messages={messages}>{children}</SapilCopyProvider>;
}

/**
 * Sapil's `StorefrontShell` (server): the v9 chrome around a page, with Sapil's
 * wording loaded for the route's language. `navbarVariant` is Swiss Arabian's
 * header showcase option and has no Sapil equivalent.
 */
export function SapilStorefrontShell({
  children,
  beforeFooter,
}: {
  children: ReactNode;
  navbarVariant?: NavbarVariant;
  /** Server content just above the footer (market SEO text). */
  beforeFooter?: ReactNode;
}) {
  return (
    <SapilRoot className="flex min-h-dvh flex-col">
      <SapilServerCopy>
        <SapilChrome beforeFooter={beforeFooter}>{children}</SapilChrome>
      </SapilServerCopy>
    </SapilRoot>
  );
}
