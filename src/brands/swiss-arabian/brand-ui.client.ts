/**
 * Client-safe part of the brand UI contract, for route files that are client
 * components (`error.tsx`, `not-found.tsx`). It must not re-export anything that
 * imports server-only APIs (`next/headers`), unlike `brand-ui.ts`.
 */
export { StorefrontShell } from "@/components/layout/StorefrontShell";
export { CrashFallback } from "@/components/ui/CrashFallback";
