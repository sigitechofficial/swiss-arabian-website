import { site } from "next/root-params";
import { setSiteParamReader } from "./currentSite";

/**
 * Page tree only (Server Components): `next/root-params` cannot be imported from
 * instrumentation or route handlers, so the page tree registers how to read the
 * `[site]` root param and shared server code (API host, SEO origin) calls it
 * through `currentSiteHost()`. Imported for its side effect by the root layout
 * and `routeLocale`, so it is loaded before any page renders.
 */
setSiteParamReader(() => site());
