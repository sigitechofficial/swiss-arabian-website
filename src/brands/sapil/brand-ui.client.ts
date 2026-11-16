/** Sapil's client-safe UI: every name of the client contract, by name (checked by ../contract.check.ts). */

// --- shell (StorefrontShell, error and 404 chrome) ---
export { SapilStorefrontShellClient as StorefrontShell } from "./components/shell/SapilStorefrontShellClient";
export { SapilCrashFallback as CrashFallback, SapilNotFoundView as NotFoundView } from "./components/states/SapilErrorViews";
