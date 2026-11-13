/** Sapil's client-safe UI (see ../swiss-arabian/brand-ui.client.ts). Overrides go below. */
export * from "../swiss-arabian/brand-ui.client";

// --- shell (StorefrontShell, error and 404 chrome) ---
export { SapilStorefrontShellClient as StorefrontShell } from "./components/shell/SapilStorefrontShellClient";
export { SapilCrashFallback as CrashFallback, SapilNotFoundView as NotFoundView } from "./components/states/SapilErrorViews";
