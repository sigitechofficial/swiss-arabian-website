"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { localizeHref } from "./localePath";

type AppRouter = ReturnType<typeof useRouter>;

/** The address the shopper is on (read when navigating, never during render). */
const currentPathname = () => (typeof window === "undefined" ? "/" : window.location.pathname || "/");

/**
 * A router whose `push`/`replace`/`prefetch` keep the page's language
 * (`/checkout` read on `/ar/…` → `/ar/checkout`).
 */
export function localeRouter(router: AppRouter, pathname: () => string = currentPathname): AppRouter {
  // Options are passed on only when given, so calls look exactly like `useRouter()`'s.
  return {
    ...router,
    push: (href, ...options) => router.push(localizeHref(href, pathname()), ...options),
    replace: (href, ...options) => router.replace(localizeHref(href, pathname()), ...options),
    prefetch: (href, ...options) => router.prefetch(localizeHref(href, pathname()), ...options),
  };
}

/**
 * `useRouter()` for shop code that navigates with bare paths. Links already keep
 * the language through `LocaleLink`; this does the same for programmatic
 * navigation (after sign-in, "Checkout", tracking lookups, payment returns).
 * Same identity as `useRouter()` across navigations, so effects that list the
 * router as a dependency don't re-run when the address changes.
 */
export function useLocaleRouter(): AppRouter {
  const router = useRouter();
  return useMemo(() => localeRouter(router), [router]);
}
